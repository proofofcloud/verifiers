import { AttestationResponse } from "./types.ts";

/**
 * Verify Intel DCAP attestation (TDX/SGX)
 * Proxies to Phala Cloud API
 */
export async function verifyIntelDcap(hex: string): Promise<AttestationResponse> {
  const normalizedHex = hex.startsWith("0x") ? hex : `0x${hex}`;

  const response = await fetch(
    "https://cloud-api.phala.network/proofofcloud/attestations/verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hex: normalizedHex }),
    }
  );

  if (!response.ok) {
    throw new Error(`Phala API error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as AttestationResponse;
}

/**
 * Verify AMD SEV-SNP attestation
 * Proxies to Nillion Verifier API
 */
export async function verifyAmdSev(hex: string): Promise<AttestationResponse> {
  // Nillion endpoint expects raw hex without 0x prefix
  const reportHex = hex.startsWith("0x") ? hex.slice(2) : hex;

  const response = await fetch("https://nilcc-verifier.nillion.network/v1/attestations/verify-amd", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report: reportHex }),
  });

  if (!response.ok) {
    throw new Error(
      `Nillion API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as { chip_id?: string };

  const result: AttestationResponse = {
    success: true,
    proof_of_cloud: true,
    quote: {
      header: {
        tee_type: "TEE_AMD_SEV_SNP",
      },
    },
    ...(data.chip_id ? { chip_id: data.chip_id } : {}),
  };

  return result;
}

/**
 * Verify AWS Nitro Enclave attestation
 * TODO: Implement AWS Nitro verification
 * See: https://docs.aws.amazon.com/enclaves/latest/user/verify-root.html
 */
export async function verifyAwsNitro(hex: string): Promise<AttestationResponse> {
  throw new Error(
    "AWS Nitro verification not implemented. Contributors welcome!"
  );
}
