"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { loginAction, registerFirstAdmin, checkHasUsers } from "@/actions/authActions";
import { LogIn, UserPlus, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const exists = await checkHasUsers();
      setHasUsers(exists);
      setLoading(false);
    }
    init();
  }, []);

  const [loginState, loginDispatch, isLoginPending] = useActionState(loginAction, undefined);

  useEffect(() => {
    if (loginState?.success) {
      toast({ title: "Sikeres bejelentkezés", description: "Üdvözöljük a rendszerben" });
      router.push("/dashboard");
      router.refresh();
    } else if (loginState?.error) {
      toast({ title: "Hiba", description: loginState.error, variant: "destructive" });
    }
  }, [loginState, router, toast]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const result = await registerFirstAdmin(formData);
    
    if (result.success) {
      toast({ title: "Siker", description: "Admin fiók létrehozva. Most már bejelentkezhet." });
      setHasUsers(true);
    } else {
      toast({ title: "Hiba", description: result.error, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            {hasUsers ? <ShieldCheck className="w-6 h-6 text-primary" /> : <UserPlus className="w-6 h-6 text-primary" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {hasUsers ? "Bejelentkezés" : "Első Admin Regisztráció"}
          </CardTitle>
          <CardDescription>
            {hasUsers 
              ? "Bérlap Rendszer - Biztonságos hozzáférés" 
              : "A rendszer még nincs beállítva. Hozza létre az első adminisztrátort."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasUsers ? (
            <form action={loginDispatch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email cím</Label>
                <Input id="email" name="email" type="email" placeholder="admin@ceg.hu" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Jelszó</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full" disabled={isLoginPending}>
                <LogIn className="mr-2 h-4 w-4" />
                {isLoginPending ? "Bejelentkezés..." : "Bejelentkezés"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-name">Teljes név</Label>
                <Input id="reg-name" name="name" placeholder="Adminisztrátor" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-email">Email cím</Label>
                <Input id="reg-email" name="email" type="email" placeholder="admin@ceg.hu" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Jelszó</Label>
                <Input id="reg-password" name="password" type="password" required />
              </div>
              <Button type="submit" className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                Admin fiók létrehozása
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
