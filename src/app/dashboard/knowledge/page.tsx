import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const { data: rawSession } = await auth.getSession();
  if (!rawSession?.user) {
    redirect("/login");
  }

  return <DashboardShell initialTab="knowledge" initialSession={rawSession} />;
}
