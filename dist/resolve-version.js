"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindLatest = FindLatest;
const simple_git_1 = require("simple-git");
const git = (0, simple_git_1.simpleGit)();
const repoUrl = "https://github.com/goharbor/harbor-cli.git";
async function FindLatest() {
    const status = await git.status();
    const list = await git.listRemote(["--tags", repoUrl]);
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
