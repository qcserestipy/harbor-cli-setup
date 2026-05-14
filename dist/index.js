import * as core from "@actions/core";
import { DetectPlatform } from "./platform.js";
import { FindLatest } from "./git-actions.js";
import { DownloadAndExtractRelease, DownloadChecksum } from "./download.js";
import { CalculateSha256, ReadChecksumFile, VerifyChecksum } from "./checksums.js";
import { InstallHarborCli } from "./install.js";
import * as path from "node:path";
async function run() {
    try {
        const desiredVersion = core.getInput("version");
        const pattern = "^(?:latest|v?[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?)$";
        if (!new RegExp(pattern).test(desiredVersion)) {
            core.setFailed(`Invalid version format: ${desiredVersion}. Expected 'latest' or a semantic version like 'v1.2.3'.`);
            return;
        }
        const buildFromSource = core.getBooleanInput("build_from_source");
        core.info(`Requested Harbor CLI version: ${desiredVersion}`);
        core.info(`Build from source: ${buildFromSource}`);
        const resolvedVersion = await FindLatest(desiredVersion);
        core.info(`Resolved version: ${resolvedVersion}`);
        const platform = DetectPlatform();
        const [releaseOutputPath, downloadedPath] = await DownloadAndExtractRelease(resolvedVersion, buildFromSource, platform);
        core.info(`Downloaded release tarball to: ${downloadedPath}`);
        const releaseChecksum = await CalculateSha256(downloadedPath);
        core.info(`Calculated SHA-256 checksum for release: ${releaseChecksum}`);
        const checksumPath = await DownloadChecksum(resolvedVersion);
        core.info(`Downloaded checksum file to: ${checksumPath}`);
        const checksums = await ReadChecksumFile(checksumPath);
        const isValid = await VerifyChecksum(resolvedVersion, platform, checksums, releaseChecksum);
        if (!isValid) {
            throw new Error(`Checksum verification failed for version ${resolvedVersion} on platform ${platform.osName}/${platform.arch}`);
        }
        core.info(`Checksum verification succeeded for version ${resolvedVersion} on platform ${platform.osName}/${platform.arch}`);
        const runnerTemp = process.env.RUNNER_TEMP || "./downloads";
        const installDir = path.join(runnerTemp, "harbor-cli-bin");
        const binaryPath = await InstallHarborCli(releaseOutputPath, installDir, platform.osName === "windows");
        core.addPath(installDir);
        core.setOutput("path", binaryPath);
        core.info(`Added Harbor CLI install directory to PATH: ${installDir}`);
        core.info(`Harbor CLI binary path: ${binaryPath}`);
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed("Unknown error occurred");
        }
    }
}
run();
