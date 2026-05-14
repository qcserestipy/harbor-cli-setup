import * as tc from "@actions/tool-cache";
import * as core from "@actions/core";
import { RepoUrl } from "./constants.js";
import { AssetName, HarborPlatform } from "./platform.js";

function getOwnerAndRepo(repoUrl: string): { owner: string; repo: string } {
  const match = repoUrl.match(/github\.com[:/](.+?)\/(.+?)(?:\.git)?$/);
  if (!match) {
    throw new Error(`Could not parse GitHub repository URL: ${repoUrl}`);
  }
  return {
    owner: match[1],
    repo: match[2]
  };
}

export async function DownloadAndExtractRelease(
  version: string,
  buildFromSource: boolean,
  platform: HarborPlatform
): Promise<[string, string]> {
  const { owner, repo } = getOwnerAndRepo(RepoUrl);
  // e.g. https://github.com/goharbor/harbor-cli/releases/download/v0.0.19/harbor-cli_0.0.19_darwin_arm64.tar.gz
  let tarballUrl: string;
  if (buildFromSource) {
    tarballUrl = `https://github.com/${owner}/${repo}/archive/refs/tags/${version}.${platform.extension}`;
  } else {
    const assetName = AssetName(version, platform);
    tarballUrl = `https://github.com/${owner}/${repo}/releases/download/${version}/${assetName}`;
  }
  core.info(`Downloading ${tarballUrl}`);
  const downloadedPath = await tc.downloadTool(tarballUrl);
  core.info(`Downloaded archive to ${downloadedPath} `);
  const extractedPath = await tc.extractTar(downloadedPath);
  core.info(`Extracted archive to ${extractedPath} `);
  return [extractedPath, downloadedPath];
}

export async function DownloadChecksum(version: string): Promise<string> {
  const { owner, repo } = getOwnerAndRepo(RepoUrl);
  // e.g. https://github.com/goharbor/harbor-cli/releases/download/v0.0.19/checksums.txt
  const checksumUrl = `https://github.com/${owner}/${repo}/releases/download/${version}/checksums.txt`;
  const downloadedPath = await tc.downloadTool(checksumUrl);
  core.info(`Downloaded checksum file to ${downloadedPath}`);
  return downloadedPath;
}