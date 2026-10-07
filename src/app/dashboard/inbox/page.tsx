import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { LiveInbox } from "@/components/dashboard/inbox/LiveInbox";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const { data: rawSession } = await auth.getSession();

  const session = rawSession?.user
    ? rawSession
    : {
        user: {
          id: "demo-operator-1",
          email: "alex@heyo.ai",
          name: "Alex (Operator)",
          role: "owner",
        },
      };

  return (
    <DashboardShell initialTab="inbox" initialSession={session}>
      <LiveInbox />
    </DashboardShell>
  );
}
