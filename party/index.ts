import type * as Party from "partykit/server";

export default class HeyoPartyServer implements Party.Server {
  static options = { hibernate: true };

  constructor(readonly room: Party.Room) {}

  async onRequest(req: Party.Request) {
    if (req.method === "OPTIONS" || req.method === "GET") {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (req.method === "POST") {
      const auth = req.headers.get("authorization");
      const expectedSecret = process.env.PARTYKIT_ADMIN_SECRET || "heyo_partykit_secret_local_dev";
      
      if (!auth || auth !== `Bearer ${expectedSecret}`) {
        return new Response("Unauthorized", { status: 401 });
      }

      try {
        const body = await req.json();
        this.room.broadcast(JSON.stringify(body));
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response("Bad Request", { status: 400 });
      }
    }

    return new Response("Method Not Allowed", { status: 405 });
  }

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`[partykit] Connected to ${this.room.id}: ${conn.id}`);
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);
      if (data.type === "typing") {
        this.room.broadcast(message, [sender.id]);
      }
    } catch (e) {
      // ignore parse errors
    }
  }
}
