import "../dashboard.css";
import ErrorBoundary from "@/app/components/ErrorBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ErrorBoundary route="dashboard">{children}</ErrorBoundary>;
}
