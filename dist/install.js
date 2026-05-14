import * as core from "@actions/core";
import * as fs from "node:fs/promises";
import * as path from "node:path";
async function findFileByName(dir, fileName) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile() && entry.name === fileName) {
            return fullPath;
        }
        if (entry.isDirectory()) {
            const found = await findFileByName(fullPath, fileName);
            if (found) {
                return found;
            }
        }
    }
    return undefined;
}
export async function InstallHarborCli(extractDir, installDir, isWindows) {
    const binaryName = "harbor-cli";
    const foundBinary = await findFileByName(extractDir, binaryName);
    if (!foundBinary) {
        throw new Error(`Could not find ${binaryName} binary in ${extractDir}`);
    }
    await fs.mkdir(installDir, { recursive: true });
    const targetPath = path.join(installDir, binaryName);
    await fs.copyFile(foundBinary, targetPath);
    if (!isWindows) {
        await fs.chmod(targetPath, 0o755);
    }
    core.info(`Installed Harbor CLI to ${targetPath}`);
    return targetPath;
}
