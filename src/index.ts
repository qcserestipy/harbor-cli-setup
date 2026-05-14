import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { DetectPlatform } from "./platform.js";
import { FindLatest } from "./git-actions.js";
import { DownloadAndExtractRelease, DownloadChecksum } from "./download.js";
import { CalculateSha256, ReadChecksumFile, VerifyChecksum } from "./checksums.js";
import { InstallHarborCli } from "./install.js";
import { BuildHarborCliFromSource } from "./build-from-source.js";
import * as path from "node:path";

async function run(): Promise<void> {
  try {
    const desiredVersion = core.getInput("version");
    const pattern = "^(?:main|latest|v?[0-9]+\\.[0-9]+\\.[0-9]+(?:-[0-9A-Za-z.-]+)?)$";
    if (!new RegExp(pattern).test(desiredVersion)) {
      core.setFailed(
        `Invalid version format: ${desiredVersion}. Expected 'main', 'latest' or a semantic version like 'v1.2.3'.`
      );
      return;
    }
    const buildFromSource = core.getBooleanInput("build_from_source");
    if (!buildFromSource && desiredVersion === "main") {
      core.setFailed(`Cannot download pre-built binaries when version is set to 'main'. Please specify a specific version or enable build from source.`);
      return;
    }
    core.info(`Requested Harbor CLI version: ${desiredVersion}`);
    core.info(`Build from source: ${buildFromSource}`);

    const resolvedVersion = await FindLatest(desiredVersion);
    core.debug(`Resolved versiono: ${resolvedVersion}`);

    const platform = DetectPlatform();

    let installDir = "";
    let binaryPath = "";

    if (buildFromSource) {
      const buildResult = await BuildHarborCliFromSource(resolvedVersion);

      installDir = buildResult.installDir;
      binaryPath = buildResult.binaryPath;

      core.setOutput("tag", buildResult.tag);
      core.setOutput("git-commit", buildResult.gitCommit);
      core.setOutput("go-version", buildResult.goVersion);
      core.setOutput("build-time", buildResult.buildTime);
    } else {
      const [releaseOutputPath, downloadedPath] = await DownloadAndExtractRelease(
        resolvedVersion,
        buildFromSource,
        platform
      );

      core.debug(`Downloaded release tarball to: ${downloadedPath}`);

      const releaseChecksum = await CalculateSha256(downloadedPath);
      core.debug(`Calculated SHA-256 checksum for release: ${releaseChecksum}`);

      const checksumPath = await DownloadChecksum(resolvedVersion);
      core.debug(`Downloaded checksum file to: ${checksumPath}`);

      const checksums = await ReadChecksumFile(checksumPath);

      const isValid = await VerifyChecksum(
        resolvedVersion,
        platform,
        checksums,
        releaseChecksum
      );

      if (!isValid) {
        throw new Error(
          `Checksum verification failed for version ${resolvedVersion} on platform ${platform.osName}/${platform.arch}`
        );
      }

      core.debug(
        `Checksum verification succeeded for version ${resolvedVersion} on platform ${platform.osName}/${platform.arch}`
      );

      const runnerTemp = process.env.RUNNER_TEMP || "./downloads";
      installDir = path.join(runnerTemp, "harbor-cli-bin");

      binaryPath = await InstallHarborCli(
        releaseOutputPath,
        installDir,
        platform.osName === "windows"
      );
    }

    core.addPath(installDir);
    core.setOutput("path", binaryPath);

    core.info(`Added Harbor CLI install directory to PATH: ${installDir}`);
    core.info(`Harbor CLI binary path: ${binaryPath}`);

    await exec.exec(binaryPath, ["version"]);


  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("Unknown error occurred");
    }
  }
}

run();