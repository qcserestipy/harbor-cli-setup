import * as core from "@actions/core";

async function run(): Promise<void> {
  try {
    const version = core.getInput("version");
    const buildFromMain = core.getBooleanInput("build-from-main");

    core.info(`Requested Harbor CLI version: ${version}`);
    core.info(`Build from main: ${buildFromMain}`);
    core.info(`Running on platform: ${process.platform}, architecture: ${process.arch}`);

    // TODO:
    // 1. Resolve latest version if version === "latest"
    // 2. Download Harbor CLI release asset
    // 3. Verify checksum or signature
    // 4. Install binary into tool cache
    // 5. Add binary path to PATH

  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("Unknown error occurred");
    }
  }
}

run();