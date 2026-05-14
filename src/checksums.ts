import * as fs from "node:fs";
import * as readline from "node:readline";
import * as crypto from "node:crypto";
import { HarborPlatform, AssetName } from "./platform.js";

export type ChecksumEntry = {
  checksum: string;
  filename: string;
};

export async function ReadChecksumFile(filePath: string): Promise<ChecksumEntry[]> {
  const entries: ChecksumEntry[] = [];

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    const [checksum, filename] = trimmed.split(/\s+/);

    if (!checksum || !filename) {
      throw new Error(`Invalid checksum line: ${line}`);
    }

    entries.push({
      checksum,
      filename
    });
  }

  return entries;
}


export async function CalculateSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => {
      hash.update(chunk);
    });

    stream.on("error", reject);

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });
  });
}

export async function VerifyChecksum(
  version: string,
  platform: HarborPlatform,
  validChecksums: ChecksumEntry[],
  retrievedChecksum: string
): Promise<boolean> {

  const assetName = AssetName(version, platform);
  const matchingEntry = validChecksums.find((entry) => entry.filename === assetName);

  if (!matchingEntry) {
    throw new Error(`No matching checksum entry found for asset: ${assetName}`);
  }

  return retrievedChecksum === matchingEntry.checksum;
}