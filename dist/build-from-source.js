import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { Git, RepoUrl } from "./constants.js";
async function getExecOutput(command, args, cwd) {
    let stdout = "";
    await exec.exec(command, args, {
        cwd,
        silent: true,
        listeners: {
            stdout: (data) => {
                stdout += data.toString();
            }
        }
    });
    return stdout.trim();
}
export async function BuildHarborCliFromSource(version) {
    const runnerTemp = process.env.RUNNER_TEMP || "./downloads";
    const sourceDir = path.join(runnerTemp, "harbor-cli-src");
    const installDir = path.join(runnerTemp, "harbor-cli-bin");
    const binaryPath = path.resolve(installDir, process.platform === "win32" ? "harbor-cli.exe" : "harbor-cli");
    await fs.rm(sourceDir, { recursive: true, force: true });
    await fs.mkdir(runnerTemp, { recursive: true });
    await fs.mkdir(installDir, { recursive: true });
    core.info(`Cloning Harbor CLI source into ${sourceDir}`);
    await Git.clone(RepoUrl, sourceDir, [
        "--branch",
        version,
        "--depth",
        "1"
    ]);
    const tag = await getExecOutput("git", ["describe", "--tags", "--always", "--dirty"], sourceDir);
    const goVersionOutput = await getExecOutput("go", ["version"]);
    const goVersion = goVersionOutput.split(/\s+/)[2] ?? goVersionOutput;
    const buildTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const gitCommit = await getExecOutput("git", ["rev-parse", "HEAD"], sourceDir);
    core.info(`Building Harbor CLI from source`);
    core.info(`Tag: ${tag}`);
    core.info(`Go version: ${goVersion}`);
    core.info(`Build time: ${buildTime}`);
    core.info(`Git commit: ${gitCommit}`);
    await exec.exec("go", [
        "build",
        "-ldflags",
        [
            `-X github.com/goharbor/harbor-cli/cmd/harbor/internal/version.Version=${tag}`,
            `-X github.com/goharbor/harbor-cli/cmd/harbor/internal/version.GoVersion=${goVersion}`,
            `-X github.com/goharbor/harbor-cli/cmd/harbor/internal/version.BuildTime=${buildTime}`,
            `-X github.com/goharbor/harbor-cli/cmd/harbor/internal/version.GitCommit=${gitCommit}`
        ].join(" "),
        "-o",
        binaryPath,
        "cmd/harbor/main.go"
    ], {
        cwd: sourceDir
    });
    if (process.platform !== "win32") {
        await fs.chmod(binaryPath, 0o755);
    }
    core.info(`Built Harbor CLI binary at ${binaryPath}`);
    return {
        binaryPath,
        installDir,
        tag,
        gitCommit,
        goVersion,
        buildTime
    };
}
