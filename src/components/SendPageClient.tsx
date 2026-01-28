"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send, Upload, FileCheck } from "lucide-react";
import {
  sendIndividualPayroll,
  matchPDFsToEmployees,
  sendMassPayrolls,
} from "@/actions/payrollActions";

interface SendPageClientProps {
  employees: any[];
}

export function SendPageClient({ employees }: SendPageClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Individual send state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  // Mass send state
  const [massFiles, setMassFiles] = useState<File[]>([]);
  const [matchedPDFs, setMatchedPDFs] = useState<any[]>([]);
  const [unmatchedFiles, setUnmatchedFiles] = useState<string[]>([]);
  const [massSending, setMassSending] = useState(false);

  // Current date for year/month
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const handleIndividualSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !pdfFile) return;

    setSending(true);

    try {
      const formData = new FormData();
      formData.append("employeeId", selectedEmployeeId);
      formData.append("pdf", pdfFile);
      formData.append("year", year.toString());
      formData.append("month", month.toString());

      const result = await sendIndividualPayroll(formData);

      if (result.success) {
        toast({
          title: "Siker!",
          description: "Bérlap sikeresen elküldve",
        });
        setPdfFile(null);
        setSelectedEmployeeId("");
        router.refresh();
      } else {
        toast({
          title: "Hiba",
          description: result.error || "Sikertelen küldés",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in individual send handle:", error);
      toast({
        title: "Hiba",
        description: "Váratlan hiba történt",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleMassFilesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);
    setMassFiles(files);

    if (files.length === 0) {
      setMatchedPDFs([]);
      setUnmatchedFiles([]);
      return;
    }

    const filesWithBytes = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        bytes: new Uint8Array(await file.arrayBuffer()),
      }))
    );

    const result = await matchPDFsToEmployees(filesWithBytes);

    if (result.success) {
      setMatchedPDFs(result.matched || []);
      setUnmatchedFiles(result.unmatched || []);
    }
  };

  const handleMassSend = async () => {
    if (matchedPDFs.length === 0) return;

    setMassSending(true);

    try {
      // Create a clean copy of matchedPDFs to ensure it's serializable if needed, 
      // although they are now using Uint8Array which is fine.
      const result = await sendMassPayrolls(matchedPDFs, year, month);

      if (result.success && result.results) {
        toast({
          title: "Tömeges küldés kész",
          description: `Sikeresen elküldve: ${result.results.sent}, Sikertelen: ${result.results.failed}`,
        });
        setMassFiles([]);
        setMatchedPDFs([]);
        setUnmatchedFiles([]);
        router.refresh();
      } else {
        toast({
          title: "Hiba",
          description: result.error || "Sikertelen küldés",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hiba",
        description: "Váratlan hiba történt",
        variant: "destructive",
      });
    } finally {
      setMassSending(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Bérlap küldés</h1>

      {/* Year/Month Selection */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Időszak beállítása</h2>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <Label htmlFor="year">Év</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              min="2000"
              max="2100"
            />
          </div>
          <div>
            <Label htmlFor="month">Hónap</Label>
            <Input
              id="month"
              type="number"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              min="1"
              max="12"
            />
          </div>
        </div>
      </Card>

      {/* Individual Send */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Egyéni küldés</h2>
        <form onSubmit={handleIndividualSend} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="employee">Dolgozó</Label>
            <select
              id="employee"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              required
            >
              <option value="">Válassz dolgozót...</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pdf">PDF fájl</Label>
            <Input
              id="pdf"
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <Button type="submit" disabled={sending}>
            <Send className="mr-2 h-4 w-4" />
            {sending ? "Küldés..." : "Bérlap küldése"}
          </Button>
        </form>
      </Card>

      {/* Mass Send */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Tömeges küldés</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="mass-pdfs">PDF fájlok (több is)</Label>
            <Input
              id="mass-pdfs"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleMassFilesChange}
            />
            <p className="text-sm text-gray-500 mt-1">
              A fájlnevek illeszkedjenek a dolgozók PDF neveivel
            </p>
          </div>

          {massFiles.length > 0 && (
            <div className="space-y-4">
              {matchedPDFs.length > 0 && (
                <div>
                  <h3 className="font-medium text-green-700 mb-2 flex items-center">
                    <FileCheck className="mr-2 h-4 w-4" />
                    Egyező fájlok ({matchedPDFs.length})
                  </h3>
                  <div className="bg-green-50 rounded-md p-3">
                    {matchedPDFs.map((match, idx) => (
                      <div key={idx} className="text-sm text-green-800">
                        {match.fileName} → {match.employeeName}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {unmatchedFiles.length > 0 && (
                <div>
                  <h3 className="font-medium text-red-700 mb-2">
                    Nem egyező fájlok ({unmatchedFiles.length})
                  </h3>
                  <div className="bg-red-50 rounded-md p-3">
                    {unmatchedFiles.map((filename, idx) => (
                      <div key={idx} className="text-sm text-red-800">
                        {filename}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchedPDFs.length > 0 && (
                <Button
                  onClick={handleMassSend}
                  disabled={massSending}
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {massSending
                    ? "Küldés folyamatban..."
                    : `${matchedPDFs.length} bérlap tömeges küldése`}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
