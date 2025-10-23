import { jobs } from "@/app/lib/data";
import { PageHeader } from "@/components/page-header";
import { JobCalendar } from "./components/job-calendar";

export default function CalendarPage() {
  return (
    <div>
      <PageHeader title="Calendar" />
      <JobCalendar jobs={jobs} />
    </div>
  );
}
