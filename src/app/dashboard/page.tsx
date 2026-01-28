import { getSentPayrolls } from "@/actions/payrollActions";
import { getEmployees } from "@/actions/employeeActions";
import { Card } from "@/components/ui/card";
import { Users, Send, Calendar } from "lucide-react";

export default async function DashboardPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [employeesResult, payrollsResult, thisMonthResult] = await Promise.all([
    getEmployees(),
    getSentPayrolls(),
    getSentPayrolls(currentYear, currentMonth),
  ]);

  const employeeCount = employeesResult.success
    ? employeesResult.employees?.length || 0
    : 0;
  const totalSent = payrollsResult.success
    ? payrollsResult.payrolls?.filter((p: any) => p.status === "sent").length ||
      0
    : 0;
  const thisMonthSent = thisMonthResult.success
    ? thisMonthResult.payrolls?.filter((p: any) => p.status === "sent")
        .length || 0
    : 0;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Áttekintés</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Összes dolgozó
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {employeeCount}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Összesen elküldve
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalSent}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Send className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Ebben a hónapban
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {thisMonthSent}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Legutóbbi küldések
        </h2>
        {payrollsResult.success && payrollsResult.payrolls?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dolgozó
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Év/Hónap
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Küldve
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Státusz
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrollsResult.payrolls.slice(0, 10).map((payroll: any) => (
                  <tr key={payroll._id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {payroll.employeeId?.name || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {payroll.year}/{payroll.month}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payroll.sentAt).toLocaleString("hu-HU")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payroll.status === "sent"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payroll.status === "sent" ? "Elküldve" : "Sikertelen"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            Még nem volt bérlap küldés
          </p>
        )}
      </Card>
    </div>
  );
}
