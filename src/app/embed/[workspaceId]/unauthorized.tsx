"use client";

import { useState } from "react";
import { ShieldAlert, X, ExternalLink } from "lucide-react";

export function UnauthorizedOrigin({
  clientOrigin,
  allowedDomains,
}: {
  clientOrigin: string;
  allowedDomains: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    window.parent.postMessage({ type: "heyo:resize", expanded: next }, "*");
  };

  const iframeStyles = (
    <style>{`
      html, body {
        height: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        background-color: transparent !important;
        overflow: hidden !important;
      }
      nextjs-portal, [data-nextjs-toast-wrapper], [data-nextjs-dev-overlay] {
        display: none !important;
      }
    `}</style>
  );

  if (!expanded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-transparent">
        {iframeStyles}
        <button
          onClick={toggle}
          aria-label="Domain Unauthorized"
          title="Heyo Widget: Unauthorized Host Origin. Click to inspect."
          className="flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer relative bg-rose-600 text-white border-2 border-white/30"
        >
          <ShieldAlert className="h-8 w-8 text-white animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-rose-500/30 bg-zinc-950 text-white shadow-2xl font-sans">
      {iframeStyles}
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-rose-600/90 text-white shrink-0">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-white" />
          <h2 className="text-xs font-bold uppercase tracking-wider">Origin Unauthorized</h2>
        </div>
        <button
          onClick={toggle}
          aria-label="Close"
          className="rounded-full p-1 text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto space-y-3">
        <div className="space-y-2">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Per <strong>ADR-0006 CORS & Domain Security</strong>, this workspace restricts widget embedding strictly to configured domains.
          </p>
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] space-y-1">
            <div className="text-zinc-400">Rejected Host Origin:</div>
            <code className="text-rose-400 font-mono font-semibold block break-all">
              {clientOrigin || "(Empty Origin)"}
            </code>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] space-y-1">
            <div className="text-zinc-400">Current Allowed Domains:</div>
            <code className="text-amber-300 font-mono text-[10px] block break-all">
              {allowedDomains || "(None configured)"}
            </code>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-[11px] text-zinc-300 space-y-1.5">
          <p className="font-semibold text-rose-300 text-xs">How to allow this website:</p>
          <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[10px]">
            <li>Open the Heyo Dashboard</li>
            <li>Go to <strong>Embed Code & Domains</strong></li>
            <li>
              Add <span className="text-emerald-400 font-mono">{clientOrigin || "localhost:3000"}</span> to Allowed Domains
            </li>
            <li>Click <strong>Save Changes</strong></li>
          </ol>
        </div>
      </div>
    </div>
  );
}
