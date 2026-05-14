import * as core from "@actions/core";

export type HarborPlatform = {
  osName: 'linux' | 'darwin' | 'windows'
  arch: 'amd64' | 'arm64'
  extension: 'tar.gz' | 'zip'
}

export function DetectPlatform(): HarborPlatform {
  core.info(`Running on platform: ${process.platform}, architecture: ${process.arch}`);
  const platform = process.platform
  const arch = process.arch

  let osName: HarborPlatform['osName']
  if (platform === 'linux') osName = 'linux'
  else if (platform === 'darwin') osName = 'darwin'
  else if (platform === 'win32') osName = 'windows'
  else throw new Error(`Unsupported OS: ${platform}`)

  let harborArch: HarborPlatform['arch']
  if (arch === 'x64') harborArch = 'amd64'
  else if (arch === 'arm64') harborArch = 'arm64'
  else throw new Error(`Unsupported architecture: ${arch}`)

  return {
    osName,
    arch: harborArch,
    extension: osName === 'windows' ? 'zip' : 'tar.gz'
  }
}

export function AssetName(version: string, platform: HarborPlatform): string {
  return `harbor-cli_${version.replace(/^v/, "")}_${platform.osName}_${platform.arch}.${platform.extension}`
}