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

    // Branch: Intel DCAP when hex is provided
    if (typeof body.hex === "string" && body.hex.length > 0) {
      const result = await verifyIntelDcap(body.hex);
      return c.json(result);
    }

    // Branch: AMD SEV when AMD keys are present
    const hasAmdKeys =
      "measurementHash" in body ||
      "dockerComposeHash" in body ||
      "nilccVersion" in body ||
      "vcpus" in body;

    if (hasAmdKeys) {
      if (!body.measurementHash) {
        return c.json({ success: false, error: "missing_measurementHash" }, 400);
      }
      if (!body.dockerComposeHash) {
        return c.json({ success: false, error: "missing_dockerComposeHash" }, 400);
      }
      if (!body.nilccVersion) {
        return c.json({ success: false, error: "missing_nilccVersion" }, 400);
      }
      if (body.vcpus === undefined) {
        return c.json({ success: false, error: "missing_vcpus" }, 400);
      }
      if (typeof body.vcpus !== "number") {
        return c.json({ success: false, error: "invalid_vcpus" }, 400);
      }

      const result = await verifyAmdSev({
        measurementHash: body.measurementHash,
        dockerComposeHash: body.dockerComposeHash,
        nilccVersion: body.nilccVersion,
        vcpus: body.vcpus,
      });
      return c.json(result);
    }

    return c.json({ success: false, error: "missing_parameters" }, 400);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, 500);
  }
});

// POST /attestations/verify/amd-sev
app.post("/attestations/verify/amd-sev", async (c) => {
  try {
    const {
      measurementHash,
      dockerComposeHash,
      nilccVersion,
      vcpus,
    } = await c.req.json();

    if (!measurementHash) {
      return c.json({ success: false, error: "missing_measurementHash" }, 400);
    }
    if (!dockerComposeHash) {
      return c.json({ success: false, error: "missing_dockerComposeHash" }, 400);
    }
    if (!nilccVersion) {
      return c.json({ success: false, error: "missing_nilccVersion" }, 400);
    }
    if (vcpus === undefined) {
      return c.json({ success: false, error: "missing_vcpus" }, 400);
    }
    if (typeof vcpus !== "number") {
      return c.json({ success: false, error: "invalid_vcpus" }, 400);
    }

    const result = await verifyAmdSev({
      measurementHash,
      dockerComposeHash,
      nilccVersion,
      vcpus,
    });

    return c.json(result);
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
