import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, Send, LogOut, FileSpreadsheet, ShieldCheck } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  Bérlap Rendszer
                </h1>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Áttekintés
                </Link>
                <Link
                  href="/dashboard/employees"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Dolgozók
                </Link>
                <Link
                  href="/dashboard/send"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Küldés
                </Link>
                <Link
                  href="/dashboard/users"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Adminok
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {session?.user?.name || session?.user?.email}
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Kijelentkezés
                </Button>
              </form>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
