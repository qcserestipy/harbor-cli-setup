# Harbor CLI Setup Action

[![Tests](https://github.com/qcserestipy/harbor-cli-setup/actions/workflows/test.yaml/badge.svg)](https://github.com/qcserestipy/harbor-cli-setup/actions/workflows/test.yaml)
[![GitHub release](https://img.shields.io/github/v/release/qcserestipy/harbor-cli-setup)](https://github.com/qcserestipy/harbor-cli-setup/releases)
[![License](https://img.shields.io/github/license/qcserestipy/harbor-cli-setup)](LICENSE)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Harbor%20CLI%20Setup-green?logo=github)](https://github.com/marketplace/actions/harbor-cli-setup)

A GitHub Action that downloads, verifies, and installs the Harbor CLI tool from official GitHub releases, or optionally builds it from the latest `main` branch.

## Description

This action downloads a pre-built Harbor CLI binary for the current runner platform, verifies its SHA-256 checksum against the official `checksums.txt` published with every release, and adds it to `PATH`. It supports both specific versions and the latest release.

Alternatively, set `build_from_source: 'true'` to build from source instead of downloading a pre-built binary. Works with any `version` value, a release tag, `latest`, or `main`. Requires Go to be set up in your workflow before calling this action.

## Features

- 🚀 Download any version of Harbor CLI or the latest release
- 🔒 SHA-256 checksum verification against the official `checksums.txt`
- 🔨 Optional source build — any release tag or `main`
- ✅ Automatic version validation
- 🎯 Cross-platform support (Linux, macOS, Windows — amd64 & arm64)
- ⚡ No Go toolchain required for binary installs

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | Semver tag (e.g. `v0.0.19`), `latest`, or `main`. `main` is only valid when `build_from_source` is `true`. | No | `latest` |
| `build_from_source` | Build from source instead of downloading a pre-built binary. Works with any version value: release tag, `latest`, or `main`. Requires Go to be set up before calling this action. | No | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | The version/tag that was installed or built |
| `path` | Full path to the harbor-cli binary |

## Usage

### Basic Usage (Latest Version)

```yaml
steps:
  - uses: actions/checkout@v4
  
  - name: Setup Harbor CLI
    uses: qcserestipy/harbor-cli-setup@0.0.2
    id: harbor-cli
  
  - name: Use Harbor CLI
    run: |
      harbor-cli version
```

### Specific Version

```yaml
steps:
  - uses: actions/checkout@v4
  
  - name: Setup Harbor CLI
    uses: qcserestipy/harbor-cli-setup@0.0.2
    id: harbor-cli
    with:
      version: 'v0.0.19'
  
  - name: Use Harbor CLI
    run: |
      echo "Installed version: ${{ steps.harbor-cli.outputs.version }}"
      harbor-cli --help
```

### Build Release from Source

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Go
    uses: actions/setup-go@v6
    with:
      go-version: '1.26.x'

  - name: Setup Harbor CLI (from source)
    uses: qcserestipy/harbor-cli-setup@0.0.2
    id: harbor-cli
    with:
      version: 'v0.0.19'
      build_from_source: 'true'

  - name: Use Harbor CLI
    run: harbor-cli version
```

### Build main from Source

```yaml
steps:
  - uses: actions/checkout@v4

  - name: Setup Go
    uses: actions/setup-go@v6
    with:
      go-version: '1.26.x'

  - name: Setup Harbor CLI (from main)
    uses: qcserestipy/harbor-cli-setup@0.0.2
    id: harbor-cli
    with:
      version: 'main'
      build_from_source: 'true'

  - name: Use Harbor CLI
    run: harbor-cli version
```

### Complete Workflow Example

```yaml
name: Harbor Deployment

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Harbor CLI
        uses: qcserestipy/harbor-cli-setup@0.0.2
        id: harbor-cli
        with:
          version: 'latest'
      
      - name: Configure Harbor CLI
        run: |
          harbor-cli login ${{ secrets.HARBOR_URL }} \
                --username ${{ secrets.HARBOR_USERNAME }} \
                --password ${{ secrets.HARBOR_PASSWORD }}
      
      - name: List Artifacts
        run: |
          harbor-cli artifact list <project_name>/<repository_name> -ojson
```

## Prerequisites

- Internet access to reach `github.com`
- **`build_from_source` only**: Go must be set up in your workflow **before** calling this action (e.g. via `actions/setup-go`)

## Error Handling

The action will fail in the following scenarios:

- **Invalid version**: The specified tag does not exist in the Harbor CLI repository
- **Checksum mismatch**: The downloaded archive does not match the SHA-256 digest in `checksums.txt`
- **Unsupported platform**: The runner OS or architecture has no matching release asset
- **Build failure**: The Go build fails (source build only)

## Supported Platforms

| Runner | Architecture |
|--------|--------------|
| `ubuntu-*` | amd64, arm64 |
| `macos-*` | amd64 (Intel), arm64 (Apple Silicon) |
| `windows-*` | amd64, arm64 |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Related

- [Harbor CLI Repository](https://github.com/goharbor/harbor-cli)
- [Harbor Project](https://goharbor.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/qcserestipy/harbor-cli-setup/issues) in this repository.
