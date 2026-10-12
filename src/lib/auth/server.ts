import "@/lib/dns-bootstrap";
import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl:
    process.env.NEON_AUTH_BASE_URL ||
    "https://ep-plain-credit-b3j9er2k.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth",
  cookies: {
    secret:
      process.env.NEON_AUTH_COOKIE_SECRET ||
      "/UijfbCIs2L1vkOW4m+WQNjuGOWEeQ1JWTE99yFIaeI=",
    sessionDataTtl: 300,
  },
});
