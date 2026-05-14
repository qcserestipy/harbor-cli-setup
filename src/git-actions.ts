import { Git, RepoUrl } from "./constants.js";

export async function FindLatest(desiredVersion: string): Promise<string> {
  const list = await Git.listRemote(["--tags", RepoUrl]);
  const versions: string[] = [];
  list.split("\n").forEach((line) => {
    const match = line.match(/refs\/tags\/(v?\d+\.\d+\.\d+)/);
    if (match) {
      versions.push(match[1]);
    }
  });
  const sorted = versions.sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base"
    })
  );

  if (desiredVersion === "latest") {
    return sorted[sorted.length - 1] || "";
  }
  else if (desiredVersion === "main") {
    return "main";
  } else {
    const exactMatch = sorted.find((v) => v === desiredVersion);
    if (exactMatch) {
      return exactMatch;
    }
  }
  throw new Error(`Version ${desiredVersion} not found in repository tags`);
}

export async function CloneRepo(version: string): Promise<void> {
  await Git.clone(RepoUrl, "./harbor-cli", ["--branch", version, "--depth", "1"]);
}