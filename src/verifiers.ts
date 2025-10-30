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

  return await response.json();
}

/**
 * Verify AMD SEV-SNP attestation
 * TODO: Implement AMD SEV-SNP verification
 * See: https://www.amd.com/system/files/TechDocs/56860.pdf
 */
export async function verifyAmdSev(params: {
  measurementHash: string;
  dockerComposeHash: string;
  nilccVersion: string;
  vcpus: number;
}): Promise<AttestationResponse> {
  const response = await fetch("https://nilcc.nillion.com/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      measurementHash: params.measurementHash,
      dockerComposeHash: params.dockerComposeHash,
      nilccVersion: params.nilccVersion,
      vcpus: params.vcpus,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Nillion API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as AttestationResponse;
  return data;
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
