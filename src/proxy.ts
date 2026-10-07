import { auth } from "@/lib/auth/server";

/**
 * Next.js 16 `proxy` (formerly `middleware`). Neon Managed Better Auth needs this
 * to exchange the `neon_auth_session_verifier` returned by the Google OAuth
 * redirect for a session cookie, and to refresh the cached session.
 * `/login` and `/signup` are intentionally excluded so they stay public.
 */
export default auth.middleware({ loginUrl: "/login" });

export const config = {
  matcher: [],
};
