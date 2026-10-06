import Link from "next/link";
import { ArrowLeft, Inbox, Users, BookOpen, Settings } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-50">
      {/* Dashboard Top Navigation */}
      <header className="flex h-16 items-center justify-between border-b border-neutral-800/80 px-6 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="h-4 w-[1px] bg-neutral-800" />
          <div className="flex items-center gap-2 font-bold text-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Heyo Operator Dashboard
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs text-neutral-300">
            Workspace: <strong className="text-white">Default</strong>
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-white">
            Hello in the Dashboard!
          </h1>
          <p className="text-sm text-neutral-400">
            Welcome to your Heyo Operator workspace. This is where your live conversations and knowledge base will live.
          </p>
        </div>

        {/* Quick-Access Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4 hover:border-neutral-700 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
              <Inbox className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Live Inbox</h2>
              <p className="text-xs text-neutral-400 mt-1">
                View incoming visitor chats, AI answering statuses, and take over chats in real time.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center rounded-md bg-neutral-800/80 px-2 py-1 text-xs text-neutral-400">
                0 Active Conversations
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4 hover:border-neutral-700 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Knowledge Base</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Upload PDFs, Markdown, and docs to build the vector knowledge base for your AI Agent.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center rounded-md bg-neutral-800/80 px-2 py-1 text-xs text-neutral-400">
                Flow A Ingestion Ready
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-4 hover:border-neutral-700 transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Widget Settings</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Configure your embed script snippet, allowed domains, and widget branding.
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center rounded-md bg-neutral-800/80 px-2 py-1 text-xs text-neutral-400">
                CORS Security Enabled
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
