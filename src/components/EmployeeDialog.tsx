"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  addEmployee,
  updateEmployee,
  type EmployeeFormData,
} from "@/actions/employeeActions";

interface EmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: any;
  mode: "add" | "edit";
}

export function EmployeeDialog({
  open,
  onOpenChange,
  employee,
  mode,
}: EmployeeDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: employee?.name || "",
    email: employee?.email || "",
    passwordHint: employee?.passwordHint || "",
    pdfName: employee?.pdfName || "",
    password: employee?.password || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result =
        mode === "add"
          ? await addEmployee(formData)
          : await updateEmployee(employee._id, formData);

      if (result.success) {
        toast({
          title: "Siker!",
          description: `Dolgozó sikeresen ${mode === "add" ? "hozzáadva" : "frissítve"}.`,
        });
        onOpenChange(false);
        router.refresh();
      } else {
        toast({
          title: "Hiba",
          description: result.error || "Ismeretlen hiba történt",
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
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Új dolgozó hozzáadása" : "Dolgozó szerkesztése"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "Add meg az új dolgozó adatait"
              : "Módosítsd a dolgozó adatait"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Név</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="passwordHint">Jelszó emlékeztető (emailbe kerül)</Label>
              <Input
                id="passwordHint"
                value={formData.passwordHint}
                onChange={(e) =>
                  setFormData({ ...formData, passwordHint: e.target.value })
                }
                required
                placeholder="pl. Adóazonosító utolsó 4 számjegye"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pdfName">PDF név</Label>
              <Input
                id="pdfName"
                value={formData.pdfName}
                onChange={(e) =>
                  setFormData({ ...formData, pdfName: e.target.value })
                }
                required
                placeholder="pl. berlap_jan2026_kovacs.pdf"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Jelszó (PDF titkosításhoz)</Label>
              <Input
                id="password"
                type="text"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                placeholder="Bizalmas kód"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Mégse
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Mentés..." : mode === "add" ? "Hozzáadás" : "Mentés"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
