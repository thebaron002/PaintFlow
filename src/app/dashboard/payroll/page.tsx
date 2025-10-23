import { PageHeader } from "@/components/page-header";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { jobs, clients } from "@/app/lib/data";
import { payrollSettings } from "@/app/lib/payroll-data";
import { Send } from "lucide-react";


export default function PayrollPage() {
  const jobsToPay = jobs.filter(job => job.status === "Open Payment");

  return (
    <div>
      <PageHeader title="Payroll" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <Card>
            <CardHeader>
              <CardTitle>Jobs Ready for Payout</CardTitle>
              <CardDescription>
                These jobs have the status "Open Payment" and are ready to be processed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Initial Payment</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobsToPay.length > 0 ? jobsToPay.map(job => {
                     const client = clients.find(c => c.id === job.clientId);
                     const clientLastName = client?.name.split(" ").pop() || "N/A";
                     const jobTitle = `${clientLastName} #${job.workOrderNumber}`;
                     const totalInvoiced = job.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
                     const payout = job.initialValue - totalInvoiced;
                    return (
                       <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium">{jobTitle}</div>
                          <div className="text-sm text-muted-foreground">{job.title}</div>
                        </TableCell>
                        <TableCell>${job.initialValue.toLocaleString()}</TableCell>
                        <TableCell>${totalInvoiced.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${payout.toLocaleString()}</TableCell>
                      </TableRow>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        No jobs are currently awaiting payment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Report</CardTitle>
              <CardDescription>
                Manage the recipients for the weekly payroll summary.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email1">Primary Recipient</Label>
                <Input id="email1" type="email" defaultValue={payrollSettings.reportRecipients[0]} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email2">Secondary Recipient</Label>
                <Input id="email2" type="email" defaultValue={payrollSettings.reportRecipients[1]} />
              </div>
               <Button variant="outline">Save Recipients</Button>
               <Button>
                 <Send className="mr-2 h-4 w-4" />
                 Send Report Now
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
