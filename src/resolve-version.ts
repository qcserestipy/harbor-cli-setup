import { simpleGit } from "simple-git";

const git = simpleGit();
const repoUrl = "https://github.com/goharbor/harbor-cli.git";

export async function FindLatest(): Promise<void> {
  const status = await git.status();
  const list = await git.listRemote(["--tags", "--sort='v:refname'", repoUrl]);
  console.log("Available versions:");
  list.split("\n").forEach((line) => {
    const match = line.match(/refs\/tags\/(v?\d+\.\d+\.\d+)/);
    if (match) {
      console.log(match[1]);
    }
  });
  console.log("Current branch:", status.current);
  console.log("Modified files:", status.modified);
  console.log("Staged files:", status.staged);

  const latestCommit = await git.log({ maxCount: 1 });

  console.log("Latest commit:", latestCommit.latest?.hash);
}

