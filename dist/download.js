import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import { RepoUrl } from "./constants.js";
import { AssetName } from "./platform.js";
function getOwnerAndRepo(repoUrl) {
    const match = repoUrl.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/);
    if (!match) {
        throw new Error(`Could not parse GitHub repository URL: ${repoUrl}`);
    }
    return {
        owner: match[1],
        repo: match[2]
    };
}
export async function DownloadAndExtractRelease(version, buildFromSource, platform) {
    const { owner, repo } = getOwnerAndRepo(RepoUrl);
    // e.g. https://github.com/goharbor/harbor-cli/releases/download/v0.0.19/harbor-cli_0.0.19_darwin_arm64.tar.gz
    let tarballUrl;
    if (buildFromSource && version !== "main") {
        tarballUrl = `https://github.com/${owner}/${repo}/archive/refs/tags/${version}.${platform.extension}`;
    }
    else if (buildFromSource && version === "main") {
        tarballUrl = `https://github.com/${owner}/${repo}/archive/refs/heads/main.${platform.extension}`;
    }
    else {
        const assetName = AssetName(version, platform);
        tarballUrl = `https://github.com/${owner}/${repo}/releases/download/${version}/${assetName}`;
    }
    core.debug(`Downloading ${tarballUrl}`);
    const downloadedPath = await tc.downloadTool(tarballUrl);
    core.debug(`Downloaded archive to ${downloadedPath} `);
    const extractedPath = await tc.extractTar(downloadedPath);
    core.debug(`Extracted archive to ${extractedPath} `);
    return [extractedPath, downloadedPath];
}
export async function DownloadChecksum(version) {
    const { owner, repo } = getOwnerAndRepo(RepoUrl);
    // e.g. https://github.com/goharbor/harbor-cli/releases/download/v0.0.19/checksums.txt
    const checksumUrl = `https://github.com/${owner}/${repo}/releases/download/${version}/checksums.txt`;
    const downloadedPath = await tc.downloadTool(checksumUrl);
    core.debug(`Downloaded checksum file to ${downloadedPath}`);
    return downloadedPath;
}
