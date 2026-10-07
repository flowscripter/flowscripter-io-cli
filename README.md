# flowscripter-io-cli

[![version](https://img.shields.io/github/v/release/flowscripter/flowscripter-io-cli?sort=semver)](https://github.com/flowscripter/flowscripter-io-cli/releases)
[![build](https://img.shields.io/github/actions/workflow/status/flowscripter/flowscripter-io-cli/release-bun-executable.yml)](https://github.com/flowscripter/flowscripter-io-cli/actions/workflows/release-bun-executable.yml)
[![license: MIT](https://img.shields.io/github/license/flowscripter/flowscripter-io-cli)](https://github.com/flowscripter/flowscripter-io-cli/blob/main/LICENSE)

> CLI for the
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

## Locations

Every command addresses data through a location argument: `--source` and
`--dest` for `copy`/`move`, and `--location` for the other commands. A
location has a `protocol` and one group of fields per installed protocol:

- `--location.protocol=file` selects the protocol. The allowed values are
  the protocols of the installed provider plugins.
- `--location.file.path=/data` and the other fields of the selected protocol
  are taken from that protocol's provider plugin, and are validated against
  it.
- For `file` (and other protocols with folders), a location with a
  `filename` addresses one file, one with a `pattern` (a glob such as
  `*.txt`) addresses the matching files in `path`, and one with neither
  addresses the whole `path` folder.

`flowscripter-io-cli <command> --help` lists the fields of every installed
protocol.

## Commands

- `list --location [--recursive] [--regex]` - list a folder, or the files
  matching a pattern location, one JSON line per item
- `get-properties --location` - print a file or folder's properties as JSON
- `set-properties --location [--last-modified] [--content-type]
[--properties.<protocol>.<name>]` - set properties: last modified time and
  content type apply to every protocol, and `--properties` holds one group
  per protocol for its own settable properties (e.g.
  `--properties.file.mode=384`)
- `delete --location` - delete a file or folder
- `copy --source --dest [--payload-kind]` - copy a file, a folder, or the
  files matching a pattern, using a direct provider copy when possible, with
  a progress bar for a single file. Prints the negotiated transfer path,
  e.g. `path: file/js -> file/js, direct`
- `move --source --dest [--payload-kind]` - move, with the same behaviour as
  `copy`
- `hash --location [--algorithm] [--payload-kind]` - hash a file by reading
  its stream directly, outside the framework's transfer path. `--algorithm`
  is one of `sha1`, `sha256` (the default, using a native hasher), `sha384`,
  `sha512` or `md5`

Common behaviour:

- `--payload-kind` is `auto` (the default, letting the registry choose),
  `js` or `native`. An unavailable kind fails with the kinds that are
  installed.
- During `copy`, `move` or `hash`, the first Ctrl-C stops gracefully and
  reports the result as stopped, and a second Ctrl-C cancels.
- Operations a protocol does not support (e.g. `list` over `https`) fail with
  a "not supported by protocol" error.
- Any required argument omitted on the command line is prompted for
  interactively, via
  [dynamic-cli-framework](https://github.com/flowscripter/dynamic-cli-framework)'s
  `ArgumentPrompterService`.

## Provider Plugins

This package has no dependency on any provider plugin. Install one or more
through the CLI's own plugin management (provided by
[dynamic-cli-framework](https://github.com/flowscripter/dynamic-cli-framework)'s
`plugin` commands). They are discovered at startup through
[dynamic-plugin-framework](https://github.com/flowscripter/dynamic-plugin-framework)'s
`NpmPluginRepository`, and several protocols, or several implementations of
one protocol, can be installed side by side:

```
bun run index.ts plugin:add @flowscripter/io-plugin-filesystem
```

## Usage

Once installed (see [Installation](#installation)), replace `bun run index.ts`
below with `flowscripter-io-cli`:

```
bun run index.ts plugin:add @flowscripter/io-plugin-filesystem
bun run index.ts list --location.protocol=file --location.file.path=.
bun run index.ts copy \
  --source.protocol=file --source.file.path=. --source.file.filename=a.txt \
  --dest.protocol=file --dest.file.path=. --dest.file.filename=b.txt
bun run index.ts copy \
  --source.protocol=file --source.file.path=. --source.file.pattern='*.txt' \
  --dest.protocol=file --dest.file.path=backup
bun run index.ts hash --location.protocol=file --location.file.path=. \
  --location.file.filename=a.txt --algorithm sha256
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
