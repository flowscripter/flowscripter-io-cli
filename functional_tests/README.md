## Executable Functional Tests

#### Setup

Ensure the executable is built:

    bun build ../index.ts --compile --outfile executable

Install requirements (virtual environment required):

    pip3 install -r pip-requirements.txt

#### Testing

Run the functional tests:

    export EXECUTABLE=./executable
    behave

`before_all` installs `@flowscripter/io-plugin-filesystem` via
`plugin:add` into a fresh `~/.flowscripter-io-cli` plugin store before any
scenario runs - these tests require network access to the real npm
registry.

To run with logging output from the test steps:

    behave --no-logcapture --no-color --logging-level=DEBUG
