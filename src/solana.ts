import {
  Connection,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";

import {
  getMint,
} from "@solana/spl-token";

/* =========================
   SOLANA CONNECTION
========================= */
const connection = new Connection(
  clusterApiUrl("devnet"),
  "confirmed"
);

/* =========================
   TYPES
========================= */
export type InspectResult = {
  mintAuthority: boolean;
  freezeAuthority: boolean;
  risk: "LOW" | "MEDIUM" | "HIGH";
};

/* =========================
   INSPECT TOKEN
========================= */
export async function inspectToken(
  mintAddress: string
): Promise<InspectResult> {
  let mintPubkey: PublicKey;

  try {
    mintPubkey = new PublicKey(mintAddress);
  } catch {
    throw new Error("Invalid mint address");
  }

  const mintInfo = await getMint(connection, mintPubkey);

  const hasMintAuthority = mintInfo.mintAuthority !== null;
  const hasFreezeAuthority = mintInfo.freezeAuthority !== null;

  // Simple rug-risk heuristic (devnet-safe)
  let risk: InspectResult["risk"] = "LOW";

  if (hasMintAuthority && hasFreezeAuthority) {
    risk = "HIGH";
  } else if (hasMintAuthority || hasFreezeAuthority) {
    risk = "MEDIUM";
  }

  return {
    mintAuthority: hasMintAuthority,
    freezeAuthority: hasFreezeAuthority,
    risk,
  };
}

