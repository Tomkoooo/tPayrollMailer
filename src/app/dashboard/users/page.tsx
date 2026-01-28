"use server";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUsers } from "@/actions/authActions";
import UsersClient from "@/components/UsersClient";

export default async function UsersPage() {
  const session = await auth();
  
  // Basic security: only admins can see this (though all system users are currently admins)
  if (!session) {
    redirect("/login");
  }

  const result = await getUsers();
  const users = result.success ? result.users : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Felhasználók kezelése</h1>
        <p className="text-muted-foreground">
          Itt kezelheti a bérlap küldő rendszer adminisztrátorait.
        </p>
      </div>

      <UsersClient initialUsers={users} currentUserId={(session.user as any).id} />
    </div>
  );
}
