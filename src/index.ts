import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { verifyIntelDcap, verifyAmdSev } from "./verifiers.ts";
import { isVerified } from "./hardware.ts";

const app = new Hono();

// Health check
app.get("/", (c) => c.json({
  name: "Proof-of-Cloud Verifiers",
  version: "1.0.0",
  status: "running",
}));

// POST /attestations/verify
app.post("/attestations/verify", async (c) => {
  try {
    const body = await c.req.json();

    const type = body.type as string | undefined;
    const hex = body.hex as string | undefined;

    if (!type) {
      return c.json({ success: false, error: "missing_type" }, 400);
    }
    if (typeof hex !== "string" || hex.length === 0) {
      return c.json({ success: false, error: "missing_hex" }, 400);
    }

    if (type === "intel") {
      const result = await verifyIntelDcap(hex);
      return c.json(result);
    } else if (type === "amd") {
      const result = await verifyAmdSev(hex);
      return c.json(result);
    }

    return c.json({ success: false, error: "invalid_type" }, 400);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});

// GET /hardware_id/:id
app.get("/hardware_id/:id", (c) => {
  const id = c.req.param("id");

  if (isVerified(id)) {
    return c.json({ success: true });
  }

  return c.json({ success: false, error: "not_found" }, 404);
});

// Start server
const port = parseInt(process.env.PORT || "3000");
console.log(`🚀 Server running on port ${port}`);

serve({ fetch: app.fetch, port });
