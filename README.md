# verifiers

Verifiers for [proofofcloud.org](https://proofofcloud.org). A simple API backend to verify TEE attestation reports and query hardware IDs.

## Features

- **Intel DCAP Support**: Verify Intel TDX and SGX attestations (via Phala Cloud API)
- **Extensible Architecture**: Easy to add AMD SEV-SNP and AWS Nitro Enclave verifiers
- **Simple API**: Two straightforward endpoints for verification and hardware ID queries
- **TypeScript**: Full type safety with Hono framework

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot reload enabled.

### Production

```bash
npm start
```

### Testing

```bash
npm test
```

The test verifies Intel DCAP attestation using a real quote from [tests/quote-no-poc.bin](tests/quote-no-poc.bin). It demonstrates:
- Reading binary quote files and converting to hex
- Calling the verification API
- Parsing all returned fields (header, body, certificates, etc.)

## API Endpoints

### 1. Verify Attestation

**POST** `/attestations/verify`

Verify a TEE attestation quote and check if it passes Proof-of-Cloud verification.

**Request:**
```bash
curl -X POST "http://localhost:3000/attestations/verify" \
  -H "Content-Type: application/json" \
  -d '{"hex": "0x040002000..."}'
```

**Request Body:**
```json
{
  "hex": "0x040002000..."
}
```

**Response (Success):**
```json
{
  "success": true,
  "quote": {
    "verified": true,
    "header": {
      "tee_type": "TEE_TDX"
    }
  },
  "proof_of_cloud": true
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "verification_failed",
  "message": "Intel DCAP verification failed: ..."
}
```

Similarlry, for AMD SEV-SNP you can do:
```bash
curl -X POST "http://localhost:3000/attestations/verify" \
  -H "Content-Type: application/json" \
  -d '{
    "measurementHash": "7ed75de...",
    "dockerComposeHash": "3ca4...",
    "nilccVersion": "0.2.1",
    "vcpus": 2
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "quote": {
    "verified": true,
    "header": {
      "tee_type": "TEE_AMD_SEV_SNP"
    }
  },
  "proof_of_cloud": true
}
```

### 2. Check Hardware ID

**GET** `/hardware_id/:id`

Query if a hardware ID is verified and accepted by Proof-of-Cloud.

**Request:**
```bash
curl "http://localhost:3000/hardware_id/abc123"
```

**Response (Found):**
```json
{
  "success": true
}
```

**Response (Not Found):**
```json
{
  "success": false,
  "error": "not_found",
  "message": "Hardware ID 'abc123' is not verified"
}
```

### 3. Health Check

**GET** `/`

Check service status and available endpoints.

**Response:**
```json
{
  "name": "Proof-of-Cloud Verifiers",
  "version": "1.0.0",
  "status": "running",
  "endpoints": {
    "attestation_verify": "POST /attestations/verify",
    "hardware_check": "GET /hardware_id/:id"
  }
}
```

## Architecture

Simple, flat structure - just **~130 lines of code**:

```
src/
├── index.ts       # Main app (50 lines)
├── verifiers.ts   # Verification functions (53 lines)
├── hardware.ts    # Hardware registry (17 lines)
└── types.ts       # Type definitions (9 lines)
```

### Supported TEE Vendors

| Vendor | Status | Notes |
|--------|--------|-------|
| Intel TDX/SGX | ✅ Implemented | Via Phala Cloud API |
| AMD SEV-SNP | 🚧 Stub | Contributors welcome |
| AWS Nitro | 🚧 Stub | Contributors welcome |

## Contributing

We welcome contributions to add support for additional TEE vendors!

### Adding a New Verifier

Add a function to [src/verifiers.ts](src/verifiers.ts) that takes a string input and returns an `AttestationResponse`:

```typescript
export async function verifyYourTee(input: string): Promise<AttestationResponse> {
  // Call your verification API or implement verification logic
  return {
    success: true,
    proof_of_cloud: true,
    quote: detaildQuoteData,
  };
}
```

Then update [src/index.ts](src/index.ts) to call your verifier. You can add a `type` field to the request, auto-detect from hex format, or try verifiers sequentially. See the existing `verifyIntelDcap()` implementation for reference.

## License

Apache 2.0
