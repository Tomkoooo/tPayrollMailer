"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Edit, Trash2, Search } from "lucide-react";
import { EmployeeDialog } from "@/components/EmployeeDialog";
import { deleteEmployee, massUploadEmployees } from "@/actions/employeeActions";

interface EmployeesClientProps {
  initialEmployees: any[];
}

export function EmployeesClient({ initialEmployees }: EmployeesClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [uploadingXLSX, setUploadingXLSX] = useState(false);

  const filteredEmployees = initialEmployees.filter((emp) =>
    [emp.name, emp.email, emp.passwordHint]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedEmployee(null);
    setDialogMode("add");
    setDialogOpen(true);
  };

  const handleEdit = (employee: any) => {
    setSelectedEmployee(employee);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Biztosan törölni szeretnéd: ${name}?`)) return;

    const result = await deleteEmployee(id);
    if (result.success) {
      toast({
        title: "Törölve",
        description: "Dolgozó sikeresen törölve",
      });
      router.refresh();
    } else {
      toast({
        title: "Hiba",
        description: result.error || "Sikertelen törlés",
        variant: "destructive",
      });
    }
  };

  const handleXLSXUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingXLSX(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await massUploadEmployees(formData);

      if (result.success) {
        toast({
          title: "Sikeres feltöltés",
          description: `${result.results?.created || 0} dolgozó létrehozva/frissítve`,
        });
        router.refresh();
      } else {
        toast({
          title: "Hiba",
          description: result.error || "Sikertelen feltöltés",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in XLSX upload handle:", error);
      toast({
        title: "Hiba",
        description: "Váratlan hiba történt",
        variant: "destructive",
      });
    } finally {
      setUploadingXLSX(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dolgozók kezelése</h1>
        <div className="flex gap-2">
          <label>
            <Button
              variant="outline"
              disabled={uploadingXLSX}
              className="cursor-pointer"
              asChild
            >
              <span>
                <Upload className="mr-2 h-4 w-4" />
                {uploadingXLSX ? "Feltöltés..." : "XLSX feltöltés"}
              </span>
            </Button>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleXLSXUpload}
              disabled={uploadingXLSX}
            />
          </label>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Új dolgozó
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Keresés név, email vagy emlékeztető alapján..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Név
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emlékeztető
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PDF név
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Műveletek
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {employee.email}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {employee.passwordHint}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {employee.pdfName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDelete(employee._id, employee.name)
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {search
                      ? "Nincs találat"
                      : "Még nincsenek dolgozók hozzáadva"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        employee={selectedEmployee}
        mode={dialogMode}
      />
    </div>
  );
}
