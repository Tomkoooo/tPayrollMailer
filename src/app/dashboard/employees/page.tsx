import { getEmployees } from "@/actions/employeeActions";
import { EmployeesClient } from "@/components/EmployeesClient";

export default async function EmployeesPage() {
  const result = await getEmployees();
  const employees = result.success ? result.employees || [] : [];

  return <EmployeesClient initialEmployees={employees} />;
}
