# flowscripter-io-cli

[![version](https://img.shields.io/github/v/release/flowscripter/flowscripter-io-cli?sort=semver)](https://github.com/flowscripter/flowscripter-io-cli/releases)
[![build](https://img.shields.io/github/actions/workflow/status/flowscripter/flowscripter-io-cli/release-bun-executable.yml)](https://github.com/flowscripter/flowscripter-io-cli/actions/workflows/release-bun-executable.yml)
[![license: MIT](https://img.shields.io/github/license/flowscripter/flowscripter-io-cli)](https://github.com/flowscripter/flowscripter-io-cli/blob/main/LICENSE)

> Example CLI for
> [pluggable-io-framework](https://github.com/flowscripter/pluggable-io-framework),
> built on
> [dynamic-cli-framework](https://github.com/flowscripter/dynamic-cli-framework)

## Installation

**NOTE**: The binaries are 10's of megabytes in size as the entire Bun runtime
is included.

#### MacOS

Via [Homebrew](https://brew.sh/):

`brew install flowscripter/tap/flowscripter-io-cli`

#### Linux

In a terminal:

`curl -fsSL https://raw.githubusercontent.com/flowscripter/flowscripter-io-cli/main/script/install.sh | sh`

#### Windows

Via [Winget](https://github.com/microsoft/winget-cli):

`winget install Flowscripter.flowscripter-io-cli`

#### Manual Install

You can download and extract the binary zip files from the
[releases](https://github.com/flowscripter/flowscripter-io-cli/releases) page.

## Commands

- `list <path> [--recursive] [--regex]` - list files/folders, one JSON line per item
- `get-properties <path>` - print size/lastModified/isFolder/mode as JSON
- `set-properties <path> [--mode]` - set file properties
- `delete <path>` - delete a file/folder
- `copy <source> <destination>` - copy a file, using a direct provider copy
  when possible (with a progress bar via
  [dynamic-cli-framework](https://github.com/flowscripter/dynamic-cli-framework)'s
  `PrinterService`)
- `move <source> <destination>` - move a file, same direct-transfer/progress
  behaviour as `copy`
- `hash <path> [--algorithm]` - hash a file by piping its readable stream
  through a `Bun.CryptoHasher` (default `sha256`) - demonstrates consuming a
  `pluggable-io-framework` stream directly, outside the framework itself

All commands operate against a filesystem source/sink provider - rooted at
`/`, so any absolute or cwd-relative path works, the same as any normal file
tool. **This package has no dependency on any provider plugin** - one must
be installed first via the CLI's own plugin management (provided by
[dynamic-cli-framework](https://github.com/flowscripter/dynamic-cli-framework)'s
`plugin` commands), then discovered purely through
[dynamic-plugin-framework](https://github.com/flowscripter/dynamic-plugin-framework)'s
`NpmPluginRepository` at runtime:

```
bun run index.ts plugin:add @flowscripter/io-plugin-filesystem
```

## Usage

Once installed (see [Installation](#installation)), replace `bun run index.ts`
below with `flowscripter-io-cli`:

```
bun run index.ts plugin:add @flowscripter/io-plugin-filesystem
bun run index.ts list .
bun run index.ts copy a.txt b.txt
bun run index.ts hash a.txt --algorithm sha256
```

## Development

Install dependencies:

`bun install`

Test:

`bun test`

Format:

`bunx oxfmt`

Lint:

`bunx oxlint index.ts src/ tests/`

## Functional Tests

Refer to [functional_tests/README.md](functional_tests/README.md)

## Documentation

Refer to
[pluggable-io-framework](https://github.com/flowscripter/pluggable-io-framework),
[pluggable-io-framework-api](https://github.com/flowscripter/pluggable-io-framework-api)
and
[io-plugin-filesystem](https://github.com/flowscripter/io-plugin-filesystem)
for the contracts and orchestration this CLI is built on.

## License

MIT © Flowscripter
