# Upgrade Service in flowscripter-io-cli

Refs flowscripter/flowscripter-io-cli#66

## Problem

`example-cli` can upgrade itself: `example-cli --upgrade` installs the latest release, and on startup it offers to turn on automatic upgrades. `flowscripter-io-cli` is released and installed the same way (GitHub release zips, `script/install.sh`, the `flowscripter/tap` Homebrew formula and the `Flowscripter.flowscripter-io-cli` winget package), but it doesn't enable the upgrade service from `dynamic-cli-framework`, so users have to reinstall by hand to get a new version.

`example-cli` gets this through `launchMultiCommandCLI` options alone: `upgradeServiceEnabled: true` plus an `upgradeLocationsConfig` (supported platforms, GitHub release asset pattern, Linux script URL, Homebrew tap and formula, winget package id). The framework then registers the `upgrade` command and two startup tasks: a background version check, and a blocking auto-upgrade task that prompts once and stores the answer. That task needs the fetch, spawn, prompter and key-value services; the key-value service needs config support. `flowscripter-io-cli` today enables only the argument prompter, spawn and plugin services.

## Acceptance criteria

1. `flowscripter-io-cli --upgrade` is a known command, and `flowscripter-io-cli --help` lists it.
2. When the installed version is the latest release, `flowscripter-io-cli --upgrade` prints that it is already up to date with the current version and exits 0.
3. When a newer release exists, `flowscripter-io-cli --upgrade` installs it with the detected install method (Homebrew on macOS, the install script on Linux, winget on Windows, or the GitHub release zip otherwise), and prints the old and new versions.
4. `--upgrade --install-method=<method>` overrides the detected method, with the methods allowed for the platform.
5. The upgrade locations point at flowscripter-io-cli's own channels: release assets `flowscripter-io-cli_{os}_{arch}.zip` on `flowscripter/flowscripter-io-cli`, `script/install.sh` on `main`, Homebrew `flowscripter/tap/flowscripter-io-cli`, winget `Flowscripter.flowscripter-io-cli`.
6. The supported platforms match the release assets that exist: Linux x64 and arm64, macOS arm64, Windows x64 and arm64. (proposed)
7. On an interactive first run from a supported install, the CLI asks once whether to enable automatic upgrades. The answer persists: "Yes" checks for and installs a newer version before each later run, "No" never asks again.
8. With prompting unavailable (non-TTY, as in the functional tests), no upgrade prompt is shown and commands behave as before. (proposed)
9. A failed version check (offline, GitHub unavailable) doesn't stop the requested command from running. (proposed)
10. The README documents `--upgrade` and the auto-upgrade prompt. (proposed)

## Non-goals

- Changes to `dynamic-cli-framework` or its upgrade service: it already supports this.
- Restarting into the new version after an auto-upgrade (`restartAfterAutoUpgrade`): off by default for `launchMultiCommandCLI`, as in `example-cli`.
- Adding a macOS x64 release build.
- Upgrading installed provider plugins (`plugin:upgrade` already exists).
- Other optional framework services `example-cli` enables (banner, completion, image printer, secrets).

## Affected repos

From the current repo graph:

- `flowscripter-io-cli`: the only code change, in its CLI feature options, plus README and tests.
- `dynamic-cli-framework` and `dynamic-cli-framework-api` (dependencies): no change. The upgrade service, `UpgradeLocationsConfig`, `SupportedOs` and `SupportedArch` already ship in the versions `flowscripter-io-cli` depends on.
- `homebrew-tap` and `winget-pkgs`: no change. The `flowscripter-io-cli` formula and winget package already exist, and the upgrade uses them as they are.
- No repo depends on `flowscripter-io-cli`, so nothing cascades.

## Open questions

1. Auto-upgrade stores its answer in the key-value service, which requires config support. Turning that on also adds the framework's config file option. Enable both, as `example-cli` does? Recommended: yes. Auto-upgrade can't persist "declined" without it, and the config file is opt-in.
2. `example-cli` lists macOS x64 as supported, but no `MacOS_x64` asset is released for either CLI. Leave it out for `flowscripter-io-cli` (criterion 6)? Recommended: yes, so a macOS x64 machine reports "unsupported" instead of failing the download.
