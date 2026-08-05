# flowscripter-io-cli

[![version](https://img.shields.io/github/v/release/flowscripter/flowscripter-io-cli?sort=semver)](https://github.com/flowscripter/flowscripter-io-cli/releases)
[![build](https://img.shields.io/github/actions/workflow/status/flowscripter/flowscripter-io-cli/release-bun-executable.yml)](https://github.com/flowscripter/flowscripter-io-cli/actions/workflows/release-bun-executable.yml)
[![license: MIT](https://img.shields.io/github/license/flowscripter/flowscripter-io-cli)](https://github.com/flowscripter/flowscripter-io-cli/blob/main/LICENSE)

> Example CLI for
> [pluggable-io-framework](https://github.com/flowscripter/pluggable-io-framework),
> built on
> [dynamic-cli-framework](https://github.com/flowscripter/dynamic-cli-framework)

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

All commands operate against the local filesystem via
[io-plugin-filesystem](https://github.com/flowscripter/io-plugin-filesystem),
discovered and instantiated dynamically through
[dynamic-plugin-framework](https://github.com/flowscripter/dynamic-plugin-framework)
(not a static import) - rooted at `/`, so any absolute or cwd-relative path
works, the same as any normal file tool.

## Usage

```
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

## Documentation

Refer to
[pluggable-io-framework](https://github.com/flowscripter/pluggable-io-framework),
[pluggable-io-framework-api](https://github.com/flowscripter/pluggable-io-framework-api)
and
[io-plugin-filesystem](https://github.com/flowscripter/io-plugin-filesystem)
for the contracts and orchestration this CLI is built on.

## License

MIT © Flowscripter
