export async function broadcastToPartyKit(roomId: string, event: { type: string; payload: unknown }) {
  try {
    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999";
    const secret = process.env.PARTYKIT_ADMIN_SECRET || "heyo_partykit_secret_local_dev";
    
    // Determine protocol based on host
    const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    
    const response = await fetch(`${protocol}://${host}/party/${roomId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error(`[PartyKit] Broadcast failed: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error(`[PartyKit] Broadcast error:`, error);
  }
}
