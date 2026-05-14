import * as fs from "node:fs";
import * as readline from "node:readline";
import * as crypto from "node:crypto";
import { AssetName } from "./platform.js";
export async function ReadChecksumFile(filePath) {
    const entries = [];
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
export async function CalculateSha256(filePath) {
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
export async function VerifyChecksum(version, platform, validChecksums, retrievedChecksum) {
    const assetName = AssetName(version, platform);
    const matchingEntry = validChecksums.find((entry) => entry.filename === assetName);
    if (!matchingEntry) {
        throw new Error(`No matching checksum entry found for asset: ${assetName}`);
    }
    return retrievedChecksum === matchingEntry.checksum;
}
