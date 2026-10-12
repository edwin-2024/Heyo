import { attachDatabasePool, upgradeWebSocket } from "@neon/functions";
import { Pool, Client } from "pg";

// Room ID -> Set of active WebSockets in this isolate
const rooms = new Map<string, Set<any>>();

// Connection pool for publishing events
let pool: Pool | null = null;
let listener: Client | null = null;
const CHANNEL = "heyo_realtime_events";
let listenerStatus = "uninitialized";

function getPool(): Pool | null {
  const connStr = process.env.DATABASE_URL;
  if (!connStr) return null;
  if (!pool) {
    pool = new Pool({ connectionString: connStr, max: 3 });
    attachDatabasePool(pool);
  }
  return pool;
}

function initListener() {
  const directConnStr = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!directConnStr || listener) {
    if (!directConnStr) listenerStatus = "no_conn_str";
    return;
  }

  try {
    listenerStatus = "connecting";
    listener = new Client({ connectionString: directConnStr });
    listener.on("error", (err) => {
      console.error("[realtime listener error]", err.message);
      listenerStatus = `error: ${err.message}`;
      listener = null;
      setTimeout(initListener, 3000);
    });

    listener.connect().then(() => {
      listener?.query(`LISTEN ${CHANNEL}`).then(() => {
        listenerStatus = "listening";
      }).catch((e) => {
        listenerStatus = `listen_failed: ${e.message}`;
        console.error("[realtime LISTEN failed]", e);
      });
    }).catch((e) => {
      listenerStatus = `connect_failed: ${e.message}`;
      console.error("[realtime connect failed]", e);
      listener = null;
      setTimeout(initListener, 3000);
    });

    listener.on("notification", (msg) => {
      if (!msg.payload) return;
      try {
        const { roomId, body } = JSON.parse(msg.payload);
        if (!roomId || !body) return;

        const sockets = rooms.get(roomId);
        if (sockets && sockets.size > 0) {
          const msgStr = typeof body === "string" ? body : JSON.stringify(body);
          for (const socket of sockets) {
            if (socket.readyState === 1 /* OPEN */) {
              try {
                socket.send(msgStr);
              } catch {
                // ignore send error
              }
            }
          }
        }
      } catch (err) {
        console.error("[realtime notification parse error]", err);
      }
    });
  } catch (err: any) {
    listenerStatus = `init_exception: ${err?.message}`;
    console.error("[realtime initListener error]", err);
  }
}

// Start listener on boot
initListener();

// Keep-alive heartbeat (every 25 seconds) to prevent proxy idle drop
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    for (const [_, sockets] of rooms) {
      for (const socket of sockets) {
        if (socket.readyState === 1 /* OPEN */) {
          try {
            socket.send(JSON.stringify({ type: "ping" }));
          } catch {
            // ignore
          }
        }
      }
    }
  }, 25_000);
  if (timer && typeof (timer as any).unref === "function") {
    (timer as any).unref();
  }
}

function parseRoomId(urlStr: string): string | null {
  const url = new URL(urlStr);
  const path = url.pathname;
  // Match /party/:roomId or /parties/:party/:roomId
  const partyMatch = path.match(/^\/party\/([^/]+)/);
  if (partyMatch) return decodeURIComponent(partyMatch[1]);
  const partiesMatch = path.match(/^\/parties\/[^/]+\/([^/]+)/);
  if (partiesMatch) return decodeURIComponent(partiesMatch[1]);
  return null;
}

async function broadcast(roomId: string, body: unknown) {
  // 1. Send to local sockets in this isolate
  const sockets = rooms.get(roomId);
  const msgStr = typeof body === "string" ? body : JSON.stringify(body);
  if (sockets) {
    for (const socket of sockets) {
      if (socket.readyState === 1 /* OPEN */) {
        try {
          socket.send(msgStr);
        } catch {
          // ignore
        }
      }
    }
  }

  // 2. Broadcast to other isolates via Postgres NOTIFY
  const p = getPool();
  if (p) {
    try {
      const payload = JSON.stringify({ roomId, body });
      if (payload.length < 7800) {
        await p.query("SELECT pg_notify($1, $2)", [CHANNEL, payload]);
      }
    } catch (err) {
      console.error("[realtime pg_notify error]", err);
    }
  }
}

export default {
  async fetch(req: Request): Promise<Response> {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(req.url);
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          status: "healthy",
          hasDbUrl: !!process.env.DATABASE_URL,
          hasUnpooled: !!process.env.DATABASE_URL_UNPOOLED,
          listenerStatus,
          roomsCount: rooms.size,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const roomId = parseRoomId(req.url);
    if (!roomId) {
      return new Response(JSON.stringify({ error: "Invalid room route" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 1. HTTP broadcast via POST
    if (req.method === "POST") {
      const auth = req.headers.get("authorization");
      const expectedSecret = process.env.PARTYKIT_ADMIN_SECRET || "heyo_partykit_secret_local_dev";

      if (!auth || auth !== `Bearer ${expectedSecret}`) {
        return new Response("Unauthorized", { status: 401, headers: corsHeaders });
      }

      try {
        const body = await req.json();
        await broadcast(roomId, body);

        return new Response(JSON.stringify({ ok: true, localSockets: rooms.get(roomId)?.size ?? 0 }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      } catch {
        return new Response("Bad Request", { status: 400, headers: corsHeaders });
      }
    }

    // 2. GET request without WebSocket upgrade: return ok
    if (req.headers.get("upgrade")?.toLowerCase() !== "websocket") {
      return new Response(JSON.stringify({ ok: true, roomId }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 3. WebSocket Upgrade
    const { socket, response } = upgradeWebSocket(req);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    const roomSockets = rooms.get(roomId)!;
    roomSockets.add(socket);

    socket.addEventListener("message", async (event: any) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : null;
        if (data && data.type === "typing") {
          await broadcast(roomId, data);
        }
      } catch {
        // ignore
      }
    });

    const cleanup = () => {
      roomSockets.delete(socket);
      if (roomSockets.size === 0) {
        rooms.delete(roomId);
      }
    };

    socket.addEventListener("close", cleanup);
    socket.addEventListener("error", cleanup);

    return response;
  },
};
