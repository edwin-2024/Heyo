import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { data: rawSession } = await auth.getSession();
  if (!rawSession?.user) {
    redirect("/login");
  }

  // Reject unverified users and redirect them to complete their OTP verification
  if (!(rawSession.user as any).emailVerified) {
    redirect(`/signup?verify=true&email=${encodeURIComponent(rawSession.user.email || "")}`);
  }

  return <DashboardShell initialSession={rawSession} />;
}
