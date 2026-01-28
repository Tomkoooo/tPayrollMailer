"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createUser, deleteUser } from "@/actions/authActions";
import { UserPlus, Trash2, Shield } from "lucide-react";

export default function UsersClient({ initialUsers, currentUserId }: { initialUsers: any[], currentUserId: string }) {
  const [users, setUsers] = useState(initialUsers);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await createUser(formData);

    if (result.success) {
      toast({ title: "Siker", description: "Új adminisztrátor létrehozva" });
      setIsAddOpen(false);
      // We rely on revalidatePath but for instant UI update we could refresh or refetch
      window.location.reload();
    } else {
      toast({ title: "Hiba", description: result.error, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === currentUserId) {
      toast({ title: "Hiba", description: "Saját magát nem törölheti", variant: "destructive" });
      return;
    }

    if (!confirm("Biztosan törölni szeretné ezt a felhasználót?")) return;

    const result = await deleteUser(id);
    if (result.success) {
      toast({ title: "Siker", description: "Felhasználó törölve" });
      window.location.reload();
    } else {
      toast({ title: "Hiba", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Új admin hozzáadása
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Új adminisztrátor</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Teljes név</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email cím</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Jelszó</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full">Létrehozás</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aktív adminisztrátorok</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Név</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Szerepkör</TableHead>
                <TableHead className="text-right">Műveletek</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Shield className="mr-2 h-3 w-3 text-primary" />
                      {user.role}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteUser(user._id)}
                      disabled={user._id === currentUserId}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
