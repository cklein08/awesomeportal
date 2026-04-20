---
name: polyget
description: >
  Cross-platform binary package manager for enterprise development tools.
  Use when the user asks to install CLI tools or dev dependencies with polyget,
  set up a polypacks.txt for a project, create or publish polyget packages,
  configure polyget repos, run tools via polyget, troubleshoot polyget installs,
  or asks about polyget commands, polyfile.yaml authoring, or package management
  for enterprise environments.
---

# Polyget

Polyget is Adobe's cross-platform binary package manager for enterprise organizations. It installs development tools from a trusted private repository (Artifactory) in a secure and consistent way across macOS, Linux, and Windows.

Polyget does **not** manage language-level or OS-level package dependencies. It is purpose-built for standalone binary tools (jq, kubectl, bazelisk, JDKs, Gradle, etc.).

## Prerequisites

- **Polyget CLI** installed and on `PATH` (see [Installation](#installation) below)
- **Authentication** configured via environment variables or `~/.netrc` (see [Authentication](#authentication) below)
- **`~/.local/bin`** (or equivalent) on `PATH` for user-level installs

## Installation

Polyget is hosted on two Artifactory instances. Use **corp** (default) when on the corporate network or VPN, and **cloud** when running in cloud CI/CD environments or from outside the corporate network.

| Instance | Base URL |
|----------|----------|
| Corp (default) | `https://artifactory.corp.adobe.com/artifactory/generic-polyget-release` |
| Cloud | `https://artifactory-uw2.adobeitc.com/artifactory/generic-polyget-release` |

### macOS / Linux

**Corp (default):**

```bash
curl -sSL https://artifactory.corp.adobe.com/artifactory/generic-polyget-release/installers/get-polyget.sh \
  | bash -s -- --install-dir "$HOME/.local/bin"
```

**Cloud:**

```bash
curl -sSL https://artifactory-uw2.adobeitc.com/artifactory/generic-polyget-release/installers/get-polyget.sh \
  | bash -s -- --install-dir "$HOME/.local/bin" --use-artifactory-cloud
```

If the cloud instance requires authentication, pass credentials:

```bash
curl -u "$HTTP_USER:$HTTP_PASSWORD" -fsSL \
  https://artifactory-uw2.adobeitc.com/artifactory/generic-polyget-release/installers/get-polyget.sh \
  | bash -s -- --install-dir "$HOME/.local/bin" --use-artifactory-cloud \
    --http-user "$HTTP_USER" --http-password "$HTTP_PASSWORD"
```

### Windows

**Corp (default):**

```powershell
iex "& { $(curl.exe -fsSL https://artifactory.corp.adobe.com/artifactory/generic-polyget-release/installers/get-polyget.ps1 `
  | Out-String) } -InstallDir (Join-Path $HOME '.local\bin')"
```

**Cloud:**

```powershell
iex "& { $(curl.exe -fsSL https://artifactory-uw2.adobeitc.com/artifactory/generic-polyget-release/installers/get-polyget.ps1 `
  | Out-String) } -InstallDir (Join-Path $HOME '.local\bin') -UseArtifactoryCloud"
```

With authentication:

```powershell
iex "& { $(curl.exe -fsSL https://artifactory-uw2.adobeitc.com/artifactory/generic-polyget-release/installers/get-polyget.ps1 `
  | Out-String) } -InstallDir (Join-Path $HOME '.local\bin') -UseArtifactoryCloud -HttpUser $user -HttpPassword $password"
```

After installing, ensure the install directory is on `PATH`.

### Verify

```bash
polyget version
```

## Authentication

Polyget packages are hosted on Adobe Artifactory. Several commands require authenticated access.

### Environment Variables (recommended)

Set these in your shell profile:

```bash
export ARTIFACTORY_USER="your-ldap-username"
export ARTIFACTORY_API_KEY="your-artifactory-api-key"
```

Additional variables supported: `PGET_USERNAME`, `PGET_PASSWORD`, `PGET_API_KEY`, `PGET_ACCESS_TOKEN`. Per-repo variables are also supported (e.g. `PGET_API_KEY_REPONAME`).

### .netrc File (alternative)

Add entries for whichever Artifactory instances you use:

```
machine artifactory.corp.adobe.com
  login your-username
  password your-api-key

machine artifactory-uw2.adobeitc.com
  login your-username
  password your-api-key
```

### Priority Order

1. Repository-specific env vars (`PGET_API_KEY_REPONAME`)
2. Global env vars (`PGET_API_KEY`, `PGET_USERNAME`/`PGET_PASSWORD`)
3. Artifactory env vars (`ARTIFACTORY_USER`/`ARTIFACTORY_API_KEY`)
4. `~/.netrc` credentials

## Usage Patterns

### Ad-hoc: Run a tool without permanently installing

```bash
polyget --silent run jq@1.7.1 --install -- jq --version
```

### User: Install a tool into your local environment

```bash
polyget install jq@1.7.1
jq --version
```

Symlinks are created in `~/.local/bin` by default.

### Project: Pin tool versions for a team

Use `polyget lock` to resolve package names to fully-qualified refs and write a lock file:

```bash
$ polyget lock jq kubectl > polypacks.txt.lock
$ cat polypacks.txt.lock
jq@1.7.1:fddbd156439b3486
kubectl@1.33.0:922caf4681310f96
```

Then install from the lock file for reproducible builds:

```bash
polyget install -f polypacks.txt.lock
```

You can also maintain a `polypacks.txt` with unpinned versions and generate the lock file from it:

```bash
polyget lock -f polypacks.txt --output-file polypacks.txt.lock
```

#### Project-level configuration

Projects typically include a `.polyget/polyget.toml` that isolates tools into a project subdirectory and defines both corp and cloud repos:

```toml
[global]
bin-dir = "./tools/bin"
cache-dir = "./tools/polyget/cache"
install-dir = "./tools/polyget/install"

[repo.oneadobe]
url = "https://artifactory.corp.adobe.com/artifactory/generic-polyget-release/v1/packages"
type = "artifactory"

[repo.oneadobecloud]
url = "https://artifactory-uw2.adobeitc.com/artifactory/generic-polyget-release/v1/packages"
type = "artifactory"
```

By default, polyget uses the first configured repo (`oneadobe`). To install from the cloud repo instead, pass `--use-repo`:

```bash
polyget install -f polypacks.txt.lock --use-repo oneadobecloud
```

Then prepend `./tools/bin` to `PATH` in the project's Makefile or Taskfile so project-pinned versions take precedence.

## Command Reference

| Command | Description |
|---------|-------------|
| `install` | Download, extract, and create symlinks for packages |
| `uninstall` | Remove installed files and bin entries |
| `run` | Run a command using binaries/env from packages |
| `deploy` | Install to a custom directory; optionally generate env files |
| `search` | Search package names and versions in configured repos |
| `lock` | Resolve versions and output fully-qualified refs |
| `status` | Check whether packages are installed |
| `create` | Build a package from a `polyfile.yaml` into local cache |
| `download` | Download a package from a repo to local cache |
| `upload` | Upload a cached package to a repo |
| `test` | Run a package's test actions |
| `describe` | Show versions and platforms from a polyfile |
| `delete` | Remove from cache and optionally from remote |
| `prune` | Remove cached revisions that are not installed |
| `browse` | TUI for exploring local and remote packages |
| `update` | Update polyget itself |
| `version` | Print polyget version |

### Key Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--polypacks-file` | `-f` | Path to a polypacks file (install, deploy, lock, run) |
| `--chdir` | `-C` | Change working directory before running |
| `--silent` | `-s` | Suppress log output |
| `--config` | `-c` | Path to config file(s) |
| `--force-download` | | Re-download even if cached |
| `--force-extract` | | Re-extract even if installed |
| `--no-symlinks` | | Skip symlink creation |
| `--run-post-install` | | Run post-install actions |
| `--os` | | Override target OS |
| `--arch` | | Override target architecture |
| `--cache-dir` | | Override cache directory |
| `--install-dir` | | Override install directory |
| `--bin-dir` | | Override bin/symlink directory |

### Searching for Packages

Use `polyget search` to discover available packages, versions, and platform support:

```bash
$ polyget search claude --show-platforms
claude-code
 - Version: 2.0.67
   - Revision: 087f43ecca177967
     - darwin/amd64
     - darwin/arm64
     - linux/amd64
     - linux/arm64
     - windows/amd64
 - Version: 2.1.71
   - Revision: b408597199bfc444
     - darwin/amd64
     - darwin/arm64
     - linux/amd64
     - linux/arm64
     - windows/amd64
```

Other useful search flags: `--show-versions`, `--show-revisions`, `--json`.

## Default Directories

### Config

| Platform | Path |
|----------|------|
| Linux | `~/.config/polyget/polyget.toml` |
| macOS | `~/Library/Application Support/polyget/polyget.toml` |
| Windows | `%APPDATA%\polyget\polyget.toml` |

### Cache

| Platform | Path |
|----------|------|
| Linux | `~/.cache/polyget/cache` |
| macOS | `~/Library/Caches/polyget/cache` |
| Windows | `%LOCALAPPDATA%\polyget\cache` |

### Install

| Platform | Path |
|----------|------|
| Linux / macOS | `~/.local/polyget/install` |
| Windows | `%LOCALAPPDATA%\polyget\install` |

### Bin (symlinks)

| Platform | Path |
|----------|------|
| Linux / macOS | `~/.local/bin` |
| Windows | `%LOCALAPPDATA%\polyget\bin` |

## Creating Packages (polyfile.yaml)

Package specs are declarative YAML files called `polyfile.yaml`. They use a hierarchical "common" composition pattern where keys at more specific levels (version > platform > architecture) override more general levels.

### Minimal polyfile.yaml example

```yaml
description: jq - command-line JSON processor

versions:
  common:
    test_package:
      actions:
        - name: "execute"
          command: "jq"
          args: ["--version"]
          assertions:
            - target: "stdout"
              operator: "contains"
              value: "{{.pgetPackageVersion}}"
  "1.7.1":
    platforms:
      darwin:
        common:
          package_info:
            archivefiles:
              - glob:
                  include: ["/**/*"]
            bindirs: ["."]
            binfiles:
              - files: ["jq"]
        arm64:
          create_package:
            actions:
              - name: "download"
                url: "https://github.com/jqlang/jq/releases/download/jq-1.7.1/jq-macos-arm64"
                hash: "0bbe619e..."
                algorithm: sha256
                destination: "jq"
```

### Key sections

| Section | Purpose |
|---------|---------|
| `create_package` | Download/extract actions to build the package |
| `test_package` | Validation actions (run via `polyget test` or `--test` flag) |
| `post_install` | Actions run after installation |
| `package_info.archivefiles` | Files captured during packaging |
| `package_info.binfiles` | Executables symlinked after extraction |
| `package_info.bindirs` | Directories prepended to `PATH` |
| `package_info.env` | Environment variables (e.g. `JAVA_HOME`) |
| `package_info.scripts` | Generated wrapper scripts |

### Action types

- **download** -- fetch a file from a URL, optionally verify hash, extract, or execute
- **extract** -- extract an archive (zip, tar.gz, etc.)
- **execute** -- run a command with optional assertions

### Build and publish workflow

```bash
cd examples/my-package
polyget create my-package@1.0.0 -d .
polyget test my-package@1.0.0
polyget upload my-package@1.0.0
```

### Platform overrides

For packages that share binaries across platforms (e.g. JARs, macOS universal binaries), use `overrides` to redirect one platform to another:

```yaml
platforms:
  overrides:
    darwin: { arm64: { os: any, arch: any }, amd64: { os: any, arch: any } }
    linux: { arm64: { os: any, arch: any }, amd64: { os: any, arch: any } }
```

## Troubleshooting

**"unauthorized" or 401 errors**
- Verify `ARTIFACTORY_USER` and `ARTIFACTORY_API_KEY` are set and correct
- Check `~/.netrc` if using file-based auth
- For repo-specific creds, ensure the env var name matches the repo name

**Package not found**
- Run `polyget search <name> --show-versions` to verify the package exists
- Check that the correct repo is configured in `polyget.toml`

**Wrong version installed**
- Use `polyget status` to inspect installed versions
- Use a lock file (`polyget lock`) for reproducible version resolution

**Symlinks not created**
- Ensure `bin-dir` is set and on `PATH`
- Check that `--no-symlinks` is not being passed
- On Windows, ensure the bin directory is in `%PATH%`

**Stale cache**
- Use `--force-download` and `--force-extract` to bypass cache
- Use `polyget prune` to clean unused cached revisions

## Example Trigger Phrases

- "install jq with polyget"
- "set up polypacks.txt for this project"
- "create a polyget package"
- "configure polyget for our Artifactory"
- "pin tool versions with polyget"
- "run a command through polyget"
- "polyget search"
- "set up polyget authentication"

## Contributing New Package Specs

New package specs (polyfile.yaml definitions) must be submitted as pull requests to the shared contribution fork that all Adobe employees can push to:

https://github.com/OneAdobe/polyget-specs-contrib

Do **not** open package spec PRs against the main polyget repository. The contribution fork is the only accepted path for new or updated package definitions.

## Resources

- Slack: [#polyget-users](https://adobe.enterprise.slack.com/archives/C09QQ3R9WNA)
- Artifactory: https://artifactory.corp.adobe.com/artifactory/generic-polyget-release-local
- Package spec contributions: https://github.com/OneAdobe/polyget-specs-contrib
