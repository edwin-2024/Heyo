import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { prisma } from "@/server/db";

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

  const userId = rawSession.user.id;
  const userName = rawSession.user.name || "Operator";

  let workspace = await prisma.workspace.findFirst({
    where: { ownerUserId: userId },
    include: { widgetSettings: true },
    orderBy: { createdAt: "desc" },
  });

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: `${userName}'s Workspace`,
        ownerUserId: userId,
        widgetSettings: {
          create: {
            brandTitle: `${userName} Support`,
            suggestedQuestions: "[]",
          },
        },
      },
      include: { widgetSettings: true },
    });
  }

  return (
    <DashboardShell
      initialSession={rawSession}
      initialWorkspace={{
        id: workspace.id,
        name: workspace.name,
        widgetSettings: workspace.widgetSettings
          ? {
              ...workspace.widgetSettings,
              themeMode: (workspace.widgetSettings.themeMode as "light" | "dark" | "system") ?? "system",
              position: (workspace.widgetSettings.position as "right" | "left") ?? "right",
              botAvatarType: (workspace.widgetSettings.botAvatarType as "glass" | "bot" | "sparkle" | "custom") ?? "glass",
              customAvatarUrl: workspace.widgetSettings.customAvatarUrl ?? "",
              suggestedQuestions: workspace.widgetSettings.suggestedQuestions ?? "[]",
            }
          : null,
      }}
    />
  );
}
