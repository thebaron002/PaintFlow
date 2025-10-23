import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PayrollPage() {
  return (
    <div>
      <PageHeader title="Payroll" />
      <Card>
        <CardHeader>
          <CardTitle>Payroll</CardTitle>
          <CardDescription>
            Manage your subcontractor payroll here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The content for the payroll page will be added soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
