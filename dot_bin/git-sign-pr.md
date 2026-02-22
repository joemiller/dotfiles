# git sign-pr

A git subcommand that re-signs all commits in a pull request with your GPG/SSH key.

## Why?

Cloud-based AI coding agents (e.g. Cursor's cloud agents) can open PRs on your behalf, but their commits are unsigned. If your repository requires signed commits, these PRs are blocked.

`git sign-pr` rebases the PR's commits to re-sign them with your local signing key and force-pushes (with lease) back to the branch. As of Q1 2026, this is the simplest workaround.

## How it works

1. Validates the PR exists and is open (before doing any heavy work)
2. Clones the repo into a temp directory using your local clone as a reference (fast, no full re-download)
3. Rebases the PR's commits, re-signing each one
4. Force-pushes with lease

## Requirements

- [gh](https://cli.github.com/) (GitHub CLI), authenticated
- Git commit signing configured (`user.signingkey`, `commit.gpgsign`, etc.)

## Install

Download `git-sign-pr` and place it anywhere on your `$PATH`:

```sh
chmod +x git-sign-pr
# move it to wherever you keep your binaries, e.g.:
mv git-sign-pr ~/.local/bin/
```

Git automatically discovers subcommands named `git-<name>` on your `$PATH`.

## Usage

From within a local clone of the repository:

```sh
git sign-pr <pr-number>
```
