"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Manage body class for menu open state
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => {
      document.body.classList.remove("menu-open");
    };
  }, [menuOpen]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Handle window resize: close menu if width >= 901px
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 901) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animation end handlers & fallback
  useEffect(() => {
    const appears = document.querySelectorAll(".appear");
    const onAnimEnd = (e: Event) => {
      const target = e.currentTarget as HTMLElement;
      if (target) {
        target.classList.add("is-in");
      }
    };

    appears.forEach((el) => {
      el.addEventListener("animationend", onAnimEnd, { once: true });
    });

    // JS Fallback after 2 requestAnimationFrames
    const rAfId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        let hasRunning = false;
        appears.forEach((el) => {
          const anims = el.getAnimations?.();
          if (anims && anims.some((a) => a.playState === "running")) {
            hasRunning = true;
          }
        });
        if (!hasRunning) {
          appears.forEach((el) => el.classList.add("is-in"));
        }
      });
    });

    return () => {
      cancelAnimationFrame(rAfId);
      appears.forEach((el) => {
        el.removeEventListener("animationend", onAnimEnd);
      });
    };
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  return (
    <>
      {/* Background grain texture */}
      <div className="grain" aria-hidden="true" />

      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="hero-video-bg"
        aria-hidden="true"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4"
          type="video/mp4"
        />
      </video>

      {/* Hero scrim */}
      <div className="hero-video-scrim" aria-hidden="true" />

      {/* Main Single-Viewport Page Grid */}
      <div className="page-container relative z-10 grid grid-rows-[auto_1fr_auto] min-h-screen">
        {/* Mobile menu backdrop */}
        <div
          className={`menu-backdrop fixed inset-0 z-40 bg-[rgba(8,8,8,0.42)] transition-all duration-300 ${
            menuOpen
              ? "opacity-100 backdrop-blur-[24px] pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={closeMenu}
          aria-hidden="true"
        />

        {/* Header - 3 Column Grid */}
        <header
          className="header relative z-50 grid grid-cols-[1fr_auto_1fr] max-[900px]:grid-cols-[1fr_auto_auto] items-center"
          style={{
            padding:
              "var(--header-y) var(--header-x) 10px",
          }}
        >
          {/* Left: Brand Logo */}
          <Link
            href="#top"
            className="logo appear appear--scale inline-flex items-center gap-[9px] justify-self-start font-semibold text-white tracking-[-0.03em] select-none"
            style={
              {
                "--d": "0.08s",
                fontSize: "var(--logo)",
              } as React.CSSProperties
            }
            aria-label="Heyo"
          >
            {/* Mark SVG 22x22 */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-[var(--logo-mark)] h-[var(--logo-mark)] text-white shrink-0"
              aria-hidden="true"
            >
              <g transform="rotate(-30 12 12)">
                <circle cx="7.3" cy="3.2" r="1.45" />
                <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <circle cx="16.7" cy="20.8" r="1.45" />
              </g>
            </svg>
            <span>
              Heyo<span className="font-normal text-neutral-400">.ai</span>
            </span>
          </Link>

          {/* Center: Desktop Nav / Full-Screen Mobile Drawer */}
          <nav
            id="site-nav"
            aria-label="Primary"
            className={`
              items-center justify-self-center
              max-[900px]:fixed max-[900px]:inset-0 max-[900px]:z-45 max-[900px]:flex max-[900px]:flex-col max-[900px]:justify-start max-[900px]:gap-3
              max-[900px]:px-[22px] max-[900px]:pt-[max(96px,calc(env(safe-area-inset-top)+88px))] max-[900px]:pb-8
              ${
                menuOpen
                  ? "max-[900px]:flex max-[900px]:opacity-100 max-[900px]:pointer-events-auto"
                  : "max-[900px]:hidden max-[900px]:opacity-0 max-[900px]:pointer-events-none"
              }
              min-[901px]:flex min-[901px]:gap-2
            `}
          >
            <Link
              href="#benefits"
              onClick={closeMenu}
              className="appear appear--scale nav-pill-shine max-[900px]:w-full max-[900px]:h-14 max-[900px]:text-[19px] max-[900px]:rounded-[10px]"
              style={{ "--d": "0.16s" } as React.CSSProperties}
            >
              <Button
                variant="liquidPill"
                size="nav"
                className="w-full h-full pointer-events-none"
              >
                Benefits
              </Button>
            </Link>

            <Link
              href="#guardrails"
              onClick={closeMenu}
              className="appear appear--soft nav-pill-shine max-[900px]:w-full max-[900px]:h-14 max-[900px]:text-[19px] max-[900px]:rounded-[10px]"
              style={{ "--d": "0.28s" } as React.CSSProperties}
            >
              <Button
                variant="liquidPill"
                size="nav"
                className="w-full h-full pointer-events-none"
              >
                Guardrails & RAG
              </Button>
            </Link>

            <Link
              href="#architecture"
              onClick={closeMenu}
              className="appear appear--scale nav-pill-shine max-[900px]:w-full max-[900px]:h-14 max-[900px]:text-[19px] max-[900px]:rounded-[10px]"
              style={{ "--d": "0.40s" } as React.CSSProperties}
            >
              <Button
                variant="liquidPill"
                size="nav"
                className="w-full h-full pointer-events-none"
              >
                Architecture
              </Button>
            </Link>

            <Link
              href="#pricing"
              onClick={closeMenu}
              className="appear appear--soft nav-pill-shine max-[900px]:w-full max-[900px]:h-14 max-[900px]:text-[19px] max-[900px]:rounded-[10px]"
              style={{ "--d": "0.52s" } as React.CSSProperties}
            >
              <Button
                variant="liquidPill"
                size="nav"
                className="w-full h-full pointer-events-none"
              >
                Pricing
              </Button>
            </Link>
          </nav>

          {/* Right: Header CTA & Mobile Burger */}
          <div className="flex items-center gap-3 justify-self-end z-50">
            <Link
              href="/login"
              className="appear appear--soft text-xs text-neutral-300 hover:text-white transition px-2 py-1 max-[560px]:hidden"
              style={{ "--d": "0.30s" } as React.CSSProperties}
            >
              Sign In
            </Link>

            <Link
              href="/dashboard"
              className="appear appear--scale btn-shine"
              style={{ "--d": "0.34s" } as React.CSSProperties}
            >
              <Button variant="solid" size="btn">
                Launch Workspace
              </Button>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="min-[901px]:hidden flex flex-col justify-center items-center w-[42px] h-[42px] rounded-[6px] border border-[var(--border)] bg-[rgba(8,8,8,0.55)] hover:border-[rgba(255,255,255,0.32)] hover:bg-[rgba(255,255,255,0.05)] transition-colors cursor-pointer z-60"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-controls="site-nav"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <span
                className={`block w-4 h-[1.5px] bg-white rounded-[1px] transition-transform duration-250 ${
                  menuOpen ? "translate-y-[6.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`block w-4 h-[1.5px] bg-white rounded-[1px] my-[5px] transition-opacity duration-200 ${
                  menuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`block w-4 h-[1.5px] bg-white rounded-[1px] transition-transform duration-250 ${
                  menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </header>

        {/* Hero Section (Bottom-centered) */}
        <main
          id="top"
          className="hero flex items-end justify-center min-h-0 px-6 max-[900px]:px-5"
          style={{
            paddingBottom: "var(--hero-gap)",
            paddingTop: "8px",
          }}
        >
          <div
            className="hero-copy relative z-10 flex flex-col items-center text-center w-full"
            style={{ maxWidth: "var(--copy-max)" }}
          >
            {/* Top Badge */}
            <div
              className="appear appear--pop inline-block"
              style={{
                "--d": "0.22s",
                marginBottom: "22px",
              } as React.CSSProperties}
            >
              <Badge
                variant="liquidBadge"
                className="gap-2 px-[15px] py-[9px] text-[length:var(--badge)] cursor-default select-none shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              >
                {/* Sparkle SVG */}
                <svg
                  width="18"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="badge-star w-[18px] h-[20px] shrink-0 drop-shadow-[0_0_3px_rgba(255,255,255,0.45)]"
                  aria-hidden="true"
                >
                  <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
                </svg>
                <span>Autonomous Guardrailed Support Architecture</span>
              </Badge>
            </div>

            {/* H1 Headline */}
            <h1
              className="font-medium tracking-[-0.045em] leading-[1.12] text-white flex flex-col items-center"
              style={{ fontSize: "var(--h1)" }}
            >
              <span className="headline-line block overflow-hidden px-[0.15em] py-[0.06em]">
                <span
                  className="appear appear--mask inline-block"
                  style={{ "--d": "0.42s" } as React.CSSProperties}
                >
                  Deploy <em className="hero-serif-em">AI agents</em> grounded in
                </span>
              </span>
              <span className="headline-line block overflow-hidden px-[0.15em] py-[0.06em]">
                <span
                  className="appear appear--mask inline-block"
                  style={{ "--d": "0.62s" } as React.CSSProperties}
                >
                  your docs with zero hallucinations.
                </span>
              </span>
            </h1>

            {/* Lede Subtitle */}
            <p
              className="lede appear appear--soft text-[#9a9a9a] leading-[1.55] tracking-[-0.015em] font-normal"
              style={
                {
                  "--d": "0.82s",
                  maxWidth: "var(--lede-max)",
                  fontSize: "var(--lede)",
                  marginTop: "18px",
                } as React.CSSProperties
              }
            >
              Heyo couples Step 3 intent classification with real-time vector RAG
              and instantaneous PartyKit operator handoffs.
            </p>

            {/* Hero CTAs */}
            <div
              className="hero-actions flex flex-wrap max-[560px]:flex-col items-center justify-center gap-[10px] w-full"
              style={{ marginTop: "26px" }}
            >
              <Link
                href="/dashboard"
                className="appear appear--btn btn-shine max-[560px]:w-full"
                style={{ "--d": "0.96s" } as React.CSSProperties}
              >
                <Button
                  variant="solid"
                  size="heroBtn"
                  className="max-[560px]:w-full"
                >
                  Start for Free
                </Button>
              </Link>

              <Link
                href="#demo"
                className="appear appear--side btn-shine max-[560px]:w-full"
                style={{ "--d": "1.10s" } as React.CSSProperties}
              >
                <Button
                  variant="liquidGhost"
                  size="heroBtn"
                  className="max-[560px]:w-full"
                >
                  See it in action
                </Button>
              </Link>
            </div>
          </div>
        </main>

        {/* Stats Footer */}
        <footer
          className="stats flex items-center justify-between gap-6 max-[900px]:flex-col max-[900px]:items-center text-[#d8d8d8]"
          style={{
            padding: "0 var(--stats-x) max(var(--stats-y), env(safe-area-inset-bottom))",
          }}
        >
          {/* Stat 1: Workflows / Intent Gate */}
          <div
            className="stat appear appear--stat inline-flex items-center gap-[14px] text-[length:var(--stat-size)] tracking-[-0.015em] whitespace-nowrap max-[900px]:whitespace-normal select-none"
            style={{ "--d": "1.12s" } as React.CSSProperties}
          >
            {/* Dual-pill / workflow SVG */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className="w-5 h-5 shrink-0 text-[#e8e8e8]"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="rectGrad1" x1="3" y1="2" x2="14" y2="22">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#3a3a3a" stopOpacity="0.62" />
                </linearGradient>
                <linearGradient id="rectGrad2" x1="3" y1="2" x2="14" y2="22">
                  <stop offset="0%" stopColor="#3a3a3a" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.62" />
                </linearGradient>
              </defs>
              <rect
                x="3.4"
                y="2.6"
                width="7.2"
                height="18.8"
                rx="3.6"
                fill="url(#rectGrad1)"
              />
              <rect
                x="13.4"
                y="2.6"
                width="7.2"
                height="18.8"
                rx="3.6"
                fill="url(#rectGrad2)"
              />
              <rect
                x="9.2"
                y="10.9"
                width="5.6"
                height="2.2"
                rx="1.1"
                fill="#4a4a4a"
              />
            </svg>
            <span>4.2M+ support queries answered</span>
          </div>

          {/* Stat 2: Reduction in Response Latency */}
          <div
            className="stat appear appear--stat inline-flex items-center gap-[14px] text-[length:var(--stat-size)] tracking-[-0.015em] whitespace-nowrap max-[900px]:whitespace-normal select-none"
            style={{ "--d": "1.28s" } as React.CSSProperties}
          >
            {/* Download / Acceleration tile */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className="w-5 h-5 shrink-0 text-[#e8e8e8]"
              aria-hidden="true"
            >
              <rect
                x="2.4"
                y="2.4"
                width="19.2"
                height="19.2"
                rx="6.2"
                fill="#ffffff"
              />
              <path
                d="M12 7.1v7.4M8.15 12.35L12 16.2l3.85-3.85"
                stroke="#111111"
                strokeWidth="1.85"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>92% reduction in first-response time</span>
          </div>

          {/* Stat 3: Multi-Avatar / Teams Onboarded */}
          <div
            className="stat appear appear--stat inline-flex items-center gap-[14px] text-[length:var(--stat-size)] tracking-[-0.015em] whitespace-nowrap max-[900px]:whitespace-normal select-none"
            style={{ "--d": "1.44s" } as React.CSSProperties}
          >
            {/* 3 Avatars SVG (38x21) */}
            <svg
              width="38"
              height="21"
              viewBox="0 0 40 22"
              className="w-[38px] h-[21px] shrink-0"
              aria-hidden="true"
            >
              {/* Avatar 1: Dark with pale face & ears */}
              <circle cx="10.2" cy="11" r="9.2" fill="#2b2b2b" />
              <ellipse cx="10.2" cy="12.1" rx="4.15" ry="3.7" fill="#f4f4f4" />
              <polygon points="7.2,5.2 8.8,8.2 6.5,8.2" fill="#2b2b2b" />
              <polygon points="13.2,5.2 13.9,8.2 11.6,8.2" fill="#2b2b2b" />
              <circle cx="8.9" cy="11.4" r="0.7" fill="#1a1a1a" />
              <circle cx="11.5" cy="11.4" r="0.7" fill="#1a1a1a" />

              {/* Avatar 2: White with smile */}
              <circle cx="20.2" cy="11" r="9.2" fill="#ffffff" />
              <circle cx="17.7" cy="9.6" r="1.7" fill="#111111" />
              <circle cx="22.7" cy="9.6" r="1.7" fill="#111111" />
              <ellipse cx="20.2" cy="12.2" rx="1.2" ry="0.8" fill="#111111" />
              <path
                d="M17.5 13.8 Q20.2 16.5 22.9 13.8"
                stroke="#111111"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />

              {/* Avatar 3: Orange with letter 'e' */}
              <circle cx="30.2" cy="11" r="9.2" fill="#f26b1d" />
              <text
                x="30.2"
                y="15.1"
                fill="#ffffff"
                fontSize="12.5"
                fontFamily="var(--font-sans)"
                fontWeight="700"
                textAnchor="middle"
              >
                e
              </text>
            </svg>
            <span>180+ support teams onboarded</span>
          </div>
        </footer>
      </div>
    </>
  );
}
