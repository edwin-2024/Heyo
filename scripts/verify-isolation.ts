import { prisma } from "../src/server/db";
import { orpc } from "../src/lib/orpc";

async function runIsolationVerification() {
  console.log("🧪 Starting Tenant & Message Isolation Verification against live API...");

  const wsA = "ws_test_tenant_a_" + Date.now();
  const wsB = "ws_test_tenant_b_" + Date.now();
  const visitorToken = "v_shared_browser_token";

  // Step 1: Workspace A sends a message from this visitor
  console.log("1. Sending message to Workspace A from visitor:", visitorToken);
  await orpc.conversation.sendMessage({
    workspaceId: wsA,
    conversationId: `conv_${wsA}_${visitorToken}`,
    visitorToken: visitorToken,
    sender: "visitor",
    text: "Secret message belonging to Workspace A",
  });

  // Step 2: Query conversation from Workspace A
  const convA = await orpc.conversation.getConversation({
    workspaceId: wsA,
    conversationId: `conv_${wsA}_${visitorToken}`,
  });
  console.log("   Workspace A messages count:", convA?.messages.length);
  if (!convA || convA.messages.length !== 1 || convA.messages[0].text !== "Secret message belonging to Workspace A") {
    throw new Error("❌ Workspace A failed to persist or return its own message");
  }

  // Step 3: Query conversation from Workspace B with the Workspace A conversation ID
  console.log("2. Verifying Workspace B cannot read Workspace A's conversation...");
  const convBAttempt = await orpc.conversation.getConversation({
    workspaceId: wsB,
    conversationId: `conv_${wsA}_${visitorToken}`,
  });
  console.log("   Workspace B query result for Workspace A convId:", convBAttempt);
  if (convBAttempt !== null) {
    throw new Error("❌ Security violation: Workspace B was able to read Workspace A conversation!");
  }

  // Step 4: Query Workspace B's own conversation (should be empty/null before any message)
  const convBEmpty = await orpc.conversation.getConversation({
    workspaceId: wsB,
    conversationId: `conv_${wsB}_${visitorToken}`,
  });
  console.log("   Workspace B own conversation before messages:", convBEmpty);
  if (convBEmpty !== null) {
    throw new Error("❌ Workspace B should not have any conversation yet");
  }

  // Step 5: Workspace B sends its own message
  console.log("3. Sending message to Workspace B from visitor:", visitorToken);
  await orpc.conversation.sendMessage({
    workspaceId: wsB,
    conversationId: `conv_${wsB}_${visitorToken}`,
    visitorToken: visitorToken,
    sender: "visitor",
    text: "Message belonging strictly to Workspace B",
  });

  // Step 6: Verify isolation of both workspaces
  const convAFinal = await orpc.conversation.getConversation({
    workspaceId: wsA,
    conversationId: `conv_${wsA}_${visitorToken}`,
  });
  const convBFinal = await orpc.conversation.getConversation({
    workspaceId: wsB,
    conversationId: `conv_${wsB}_${visitorToken}`,
  });

  console.log("4. Verifying final isolation:");
  console.log("   Workspace A messages:", convAFinal?.messages.map((m) => m.text));
  console.log("   Workspace B messages:", convBFinal?.messages.map((m) => m.text));

  if (convAFinal?.messages.length !== 1 || convAFinal?.messages[0].text !== "Secret message belonging to Workspace A") {
    throw new Error("❌ Workspace A messages were corrupted or leaked!");
  }
  if (convBFinal?.messages.length !== 1 || convBFinal?.messages[0].text !== "Message belonging strictly to Workspace B") {
    throw new Error("❌ Workspace B messages were corrupted or leaked!");
  }

  // Clean up test records
  await prisma.conversation.deleteMany({ where: { workspaceId: { in: [wsA, wsB] } } });
  await prisma.widgetSettings.deleteMany({ where: { workspaceId: { in: [wsA, wsB] } } });
  await prisma.workspace.deleteMany({ where: { id: { in: [wsA, wsB] } } });

  console.log("🎉 SUCCESS: Tenant Isolation & Cross-Workspace Session Tests Passed with 100% accuracy!");
}

runIsolationVerification()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  });
