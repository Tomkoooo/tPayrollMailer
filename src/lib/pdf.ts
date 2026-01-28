import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { tmpdir } from "os";

/**
 * Encrypts a PDF buffer with a password using system qpdf
 * @param pdfInput - Original PDF buffer or Uint8Array
 * @param password - User password for PDF encryption
 * @returns Encrypted PDF buffer
 */
export async function encryptPDF(
  pdfInput: Buffer | Uint8Array,
  password: string
): Promise<Buffer> {
  const tempId = Math.random().toString(36).substring(7);
  const inputPath = path.join(tmpdir(), `input_${tempId}.pdf`);
  const outputPath = path.join(tmpdir(), `output_${tempId}.pdf`);

  try {
    // Write input PDF to temp file
    fs.writeFileSync(inputPath, Buffer.from(pdfInput));

    // Use qpdf for encryption
    // key-length: 256 (AES-256)
    // Same password for user and owner
    const command = `qpdf --encrypt "${password}" "${password}" 256 -- "${inputPath}" "${outputPath}"`;
    execSync(command);

    // Read encrypted PDF
    const encryptedBuffer = fs.readFileSync(outputPath);

    return encryptedBuffer;
  } catch (error) {
    console.error("Error encrypting PDF with qpdf:", error);
    throw new Error("Failed to encrypt PDF");
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    } catch (cleanupError) {
      console.error("Failed to cleanup PDF temp files:", cleanupError);
    }
  }
}

/**
 * Note: pdf-lib has limited native encryption support.
 * For production use with AES-256 and strict permissions:
 * 1. Consider using node-qpdf or hummus for encryption
 * 2. Or use Python's pikepdf via child_process
 * 3. Or use external service for encryption
 * 
 * Example with qpdf (requires qpdf binary installed):
 * ```
 * import { execSync } from 'child_process';
 * execSync(`qpdf --encrypt ${password} ${password} 256 --print=none --modify=none --extract=n -- input.pdf output.pdf`);
 * ```
 */
