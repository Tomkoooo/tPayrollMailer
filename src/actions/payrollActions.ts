"use server";

import { revalidateTag } from "next/cache";
import dbConnect from "@/lib/mongodb";
import Employee from "@/models/Employee";
import SentPayroll from "@/models/SentPayroll";
import { encryptPDF } from "@/lib/pdf";
import { sendEmail } from "@/lib/email";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";

/**
 * Send individual payroll
 */
export async function sendIndividualPayroll(formData: FormData) {
  let tempPath: string | null = null;
  let employeeId: string | undefined;
  let year: number | undefined;
  let month: number | undefined;

  try {
    employeeId = formData.get("employeeId") as string;
    const pdfFile = formData.get("pdf") as File;
    year = parseInt(formData.get("year") as string);
    month = parseInt(formData.get("month") as string);

    if (!employeeId || !pdfFile || !year || !month) {
      return { success: false, error: "Missing required fields" };
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    await dbConnect();

    // Get employee with password
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    // Encrypt PDF with employee's password
    const encryptedPDF = await encryptPDF(pdfBuffer, employee.password);

    // Send email
    await sendEmail({
      to: employee.email,
      subject: `Bérlap - ${year}/${month}`,
      body: `
        <h2>Kedves ${employee.name}!</h2>
        <p>Elérhetővé vált a ${year}. évi ${month}. havi bérlapod.</p>
        <p><strong>PDF jelszó emlékeztető:</strong> ${employee.passwordHint}</p>
        <p>Mellékelten csatolva találod a PDF fájlt.</p>
        <br/>
        <p>Üdvözlettel,<br/>Pénzügy</p>
      `,
      attachmentName: employee.pdfName,
      attachmentContent: encryptedPDF,
    });

    // Log to database
    await SentPayroll.create({
      employeeId: employee._id,
      year,
      month,
      pdfNameUsed: employee.pdfName,
      status: "sent",
    });

    revalidateTag("sent-payrolls");

    return { success: true };
  } catch (error) {
    console.error("Error sending payroll:", error);

    // Log failed attempt
    try {
      await SentPayroll.create({
        employeeId,
        year,
        month,
        pdfNameUsed: "unknown",
        status: "failed",
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return { success: false, error: "Failed to send payroll" };
  } finally {
    // Cleanup temp file if created
    if (tempPath) {
      try {
        await fs.unlink(tempPath);
      } catch (e) {
        console.error("Failed to cleanup temp file:", e);
      }
    }
  }
}

interface MatchedPDF {
  employeeId: string;
  employeeName: string;
  fileName: string;
  bytes: Uint8Array;
}

/**
 * Match uploaded PDFs to employees by filename
 */
export async function matchPDFsToEmployees(
  files: Array<{ name: string; bytes: Uint8Array }>
) {
  try {
    await dbConnect();

    const employees = await Employee.find({}).lean();
    const matched: MatchedPDF[] = [];
    const unmatched: string[] = [];

    for (const file of files) {
      const employee = employees.find((emp) => emp.pdfName === file.name);

      if (employee) {
        matched.push({
          employeeId: (employee as any)._id.toString(),
          employeeName: (employee as any).name,
          fileName: file.name,
          bytes: file.bytes,
        });
      } else {
        unmatched.push(file.name);
      }
    }

    return {
      success: true,
      matched,
      unmatched,
    };
  } catch (error) {
    console.error("Error matching PDFs:", error);
    return { success: false, error: "Failed to match PDFs" };
  }
}

/**
 * Send mass payrolls for matched PDFs
 */
export async function sendMassPayrolls(
  matched: MatchedPDF[],
  year: number,
  month: number
) {
  try {
    await dbConnect();

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const item of matched) {
      try {
        const employee = await Employee.findById(item.employeeId);
        if (!employee) {
          results.failed++;
          results.errors.push(`Employee not found: ${item.employeeName}`);
          continue;
        }

        // Encrypt PDF
        const encryptedPDF = await encryptPDF(Buffer.from(item.bytes), employee.password);

        // Send email
        await sendEmail({
          to: employee.email,
          subject: "Bérlapod",
          body: `
            <h2>Kedves ${employee.name}!</h2>
            <p>Mellékelten megtalálod a bérlapodat.</p>
            <p><strong>PDF jelszó emlékeztető:</strong> ${employee.passwordHint}</p>
            <p>Üdvözlettel,<br>Pénzügy</p>
          `,
          attachmentName: employee.pdfName,
          attachmentContent: encryptedPDF,
        });

        // Log success
        await SentPayroll.create({
          employeeId: employee._id,
          year,
          month,
          pdfNameUsed: employee.pdfName,
          status: "sent",
        });

        results.sent++;
      } catch (error) {
        console.error(`Error sending to ${item.employeeName}:`, error);
        results.failed++;
        results.errors.push(`Failed to send to ${item.employeeName}`);

        // Log failure
        try {
          await SentPayroll.create({
            employeeId: item.employeeId,
            year,
            month,
            pdfNameUsed: item.fileName,
            status: "failed",
          });
        } catch (logError) {
          console.error("Failed to log error:", logError);
        }
      }
    }

    revalidateTag("sent-payrolls");

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("Error in mass send:", error);
    return { success: false, error: "Failed to send mass payrolls" };
  }
}

/**
 * Get sent payrolls with optional filters
 */
export async function getSentPayrolls(year?: number, month?: number) {
  try {
    await dbConnect();

    const query: any = {};
    if (year) query.year = year;
    if (month) query.month = month;

    const payrolls = await SentPayroll.find(query)
      .populate("employeeId", "name email code")
      .sort({ sentAt: -1 })
      .lean();

    return {
      success: true,
      payrolls: JSON.parse(JSON.stringify(payrolls)),
    };
  } catch (error) {
    console.error("Error fetching sent payrolls:", error);
    return { success: false, error: "Failed to fetch sent payrolls" };
  }
}
