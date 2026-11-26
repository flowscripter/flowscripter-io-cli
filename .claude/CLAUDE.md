# flowscripter-io-cli notes

- Checks (CI runs no tsc, run it anyway): `bunx tsc --noEmit -p tsconfig.json`, `bunx oxlint index.ts src/ tests/`, `bunx oxfmt --check`, `bun test --coverage`, `bunx typedoc index.ts`, `bun build index.ts --compile`. No package.json scripts.
- Functional tests (behave) run against the compiled executable and `plugin:add` the real npm io-plugin-filesystem into `~/.flowscripter-io-cli` after deleting it: run locally only with a temp `HOME`, unset `FORCE_COLOR` (colored JSON breaks the asserts) and a venv (`python3 -m venv /tmp/behave-venv`).
- Since Plan 4 (PR #31): `cli()` runs `ProviderRegistry.discover()` before `launchMultiCommandCLI`; commands are `createXCommand(registry)` factories; locations are `ComplexOption`s (`--source.protocol=file --source.file.path=... --source.file.filename=...`) built by `zodToComplexOption` from each factory's `locationSchema`; Ctrl-C uses `ShutdownService.enterLongRunningMode` plus our own SIGINT listener (1st = stop, 2nd = signal).
- Tests mirror `src/` as `tests/<dir>/<Name>.test.ts`; fixtures in `tests/fixtures/` (`installFilesystemPlugin` symlinks the devDependency plugin into a temp store via `FLOWSCRIPTER_IO_CLI_PLUGINS_PATH`).
- dynamic-cli-framework before 8.0.1 cached nested option lookups by parent name only, so `--properties.file.*` collided with `--location.file.*` (dcf PR #228).
