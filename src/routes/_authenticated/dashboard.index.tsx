import { createFileRoute } from "@tanstack/react-router";
import { MyLibrary } from "@/components/site/DashboardSections";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: MyLibrary,
});
