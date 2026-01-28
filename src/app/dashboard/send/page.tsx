import { getEmployees } from "@/actions/employeeActions";
import { SendPageClient } from "@/components/SendPageClient";

export default async function SendPage() {
  const result = await getEmployees();
  const employees = result.success ? result.employees || [] : [];

  return <SendPageClient employees={employees} />;
}
