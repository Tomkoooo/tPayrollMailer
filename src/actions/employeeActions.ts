"use server";

import { revalidateTag } from "next/cache";
import dbConnect from "@/lib/mongodb";
import Employee, { IEmployee } from "@/models/Employee";
import { z } from "zod";
import * as XLSX from "xlsx";

// Validation schema
const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  passwordHint: z.string().min(1, "Password hint is required"),
  pdfName: z.string().min(1, "PDF name is required"),
  password: z.string().min(1, "Password is required"),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

/**
 * Get all employees with optional search
 */
export async function getEmployees(search?: string) {
  try {
    await dbConnect();

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { passwordHint: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const employees = await Employee.find(query)
      .select("-password") // Don't send passwords to client
      .sort({ createdAt: -1 })
      .lean();

    return {
      success: true,
      employees: JSON.parse(JSON.stringify(employees)),
    };
  } catch (error) {
    console.error("Error fetching employees:", error);
    return { success: false, error: "Failed to fetch employees" };
  }
}

/**
 * Get single employee by ID (includes password for PDF encryption)
 */
export async function getEmployeeById(id: string) {
  try {
    await dbConnect();
    const employee = await Employee.findById(id).lean();

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    return {
      success: true,
      employee: JSON.parse(JSON.stringify(employee)),
    };
  } catch (error) {
    console.error("Error fetching employee:", error);
    return { success: false, error: "Failed to fetch employee" };
  }
}

/**
 * Add new employee
 */
export async function addEmployee(data: EmployeeFormData) {
  try {
    const validatedData = employeeSchema.parse(data);
    await dbConnect();
    await Employee.create(validatedData);
    revalidateTag("employees");
    return { success: true };
  } catch (error: any) {
    console.error("Error adding employee:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return {
        success: false,
        error: `Employee with this ${field} already exists`,
      };
    }

    return { success: false, error: error.message || "Failed to add employee" };
  }
}

/**
 * Update employee
 */
export async function updateEmployee(id: string, data: EmployeeFormData) {
  try {
    const validatedData = employeeSchema.parse(data);
    await dbConnect();

    const employee = await Employee.findByIdAndUpdate(id, validatedData, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    revalidateTag("employees");

    return { success: true };
  } catch (error: any) {
    console.error("Error updating employee:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return {
        success: false,
        error: `Employee with this ${field} already exists`,
      };
    }

    return {
      success: false,
      error: error.message || "Failed to update employee",
    };
  }
}

/**
 * Delete employee
 */
export async function deleteEmployee(id: string) {
  try {
    await dbConnect();

    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    revalidateTag("employees");

    return { success: true };
  } catch (error) {
    console.error("Error deleting employee:", error);
    return { success: false, error: "Failed to delete employee" };
  }
}

/**
 * Mass upload employees from XLSX file
 * Expected columns: A=name, B=email, C=passwordHint, D=pdfName, E=password
 */
export async function massUploadEmployees(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file uploaded" };
    }

    const arrayBuffer = await file.arrayBuffer();
    await dbConnect();

    // Parse XLSX from buffer
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Skip header row if exists
    const startRow = data[0] && typeof data[0][0] === "string" ? 1 : 0;
    const employees: EmployeeFormData[] = [];
    const errors: string[] = [];

    for (let i = startRow; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 5) continue; // Skip empty rows

      const employeeData = {
        name: String(row[0] || "").trim(),
        email: String(row[1] || "").trim(),
        passwordHint: String(row[2] || "").trim(),
        pdfName: String(row[3] || "").trim(),
        password: String(row[4] || "").trim(),
      };

      const result = employeeSchema.safeParse(employeeData);
      if (result.success) {
        employees.push(result.data);
      } else {
        errors.push(`Row ${i + 1}: ${result.error.errors[0].message}`);
      }
    }

    if (employees.length === 0) {
      return {
        success: false,
        error: "No valid employees found in file",
        errors,
      };
    }

    // Upsert employees by email
    const results = { created: 0, failed: 0 };
    for (const emp of employees) {
      try {
        await Employee.findOneAndUpdate(
          { email: emp.email },
          emp,
          { upsert: true, new: true }
        );
        results.created++;
      } catch (err) {
        results.failed++;
        errors.push(`Failed to save ${emp.email}`);
      }
    }

    revalidateTag("employees");

    return {
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Error processing XLSX file:", error);
    return { success: false, error: "Failed to process XLSX file" };
  }
}
