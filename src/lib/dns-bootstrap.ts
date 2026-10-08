import dns from "node:dns";

const GLOBAL_PATCH_KEY = Symbol.for("heyo.dns_patch_applied");
const globalAny = globalThis as unknown as { [GLOBAL_PATCH_KEY]?: boolean };

if (!globalAny[GLOBAL_PATCH_KEY] && typeof window === "undefined") {
  globalAny[GLOBAL_PATCH_KEY] = true;

  try {
    if (typeof dns.setDefaultResultOrder === "function") {
      dns.setDefaultResultOrder("ipv4first");
    }
  } catch {
    // Ignore if not supported in runtime
  }

  const origLookup = dns.lookup;
  const resolver = new dns.Resolver();
  resolver.setServers(["8.8.8.8", "1.1.1.1"]);
  const cache = new Map<string, string>();

  // Pre-seed known Neon Auth host for 0ms lookup
  cache.set(
    "ep-gentle-band-b3u32vfr.neonauth.c-4.ap-southeast-1.aws.neon.tech",
    "18.139.35.231"
  );

  function decodeNat64(ipv6: string): string | null {
    const m = ipv6.match(/^64:ff9b::([0-9a-fA-F]+):([0-9a-fA-F]+)$/i);
    if (!m) return null;
    const p1 = parseInt(m[1], 16);
    const p2 = parseInt(m[2], 16);
    return `${(p1 >> 8) & 0xff}.${p1 & 0xff}.${(p2 >> 8) & 0xff}.${p2 & 0xff}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dns.lookup = function (hostname: string, options: any, callback: any) {
    let cb = callback;
    let opts = options;
    if (typeof opts === "function") {
      cb = opts;
      opts = {};
    }

    if (
      typeof hostname === "string" &&
      (hostname.includes("neonauth") || hostname.includes("neon.tech"))
    ) {
      if (cache.has(hostname)) {
        const ip = cache.get(hostname)!;
        if (opts && opts.all) {
          return cb(null, [{ address: ip, family: 4 }]);
        }
        return cb(null, ip, 4);
      }

      resolver.resolve4(hostname, (err, addresses) => {
        if (!err && addresses && addresses.length > 0) {
          const ip = addresses[0];
          cache.set(hostname, ip);
          if (opts && opts.all) {
            return cb(null, [{ address: ip, family: 4 }]);
          }
          return cb(null, ip, 4);
        }

        // Fallback to original lookup and decode RFC 6052 NAT64 if present
        origLookup(hostname, opts, (err2, address, family) => {
          if (!err2 && typeof address === "string") {
            const decoded = decodeNat64(address);
            if (decoded) {
              cache.set(hostname, decoded);
              if (opts && opts.all) {
                return cb(null, [{ address: decoded, family: 4 }]);
              }
              return cb(null, decoded, 4);
            }
          }
          cb(err2, address, family);
        });
      });
      return;
    }

    return origLookup(hostname, opts, cb);
  } as typeof dns.lookup;
}

export {};
