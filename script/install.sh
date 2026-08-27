#!/bin/sh

set -e

ARCH=$(uname -m)
case "$ARCH" in
  x86_64)
    ARCH_SUFFIX="x64"
    ;;
  aarch64|arm64)
    ARCH_SUFFIX="arm64"
    ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

URL="https://github.com/flowscripter/flowscripter-io-cli/releases/latest/download/flowscripter-io-cli_Linux_${ARCH_SUFFIX}.zip"

TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

echo "Downloading flowscripter-io-cli..."
curl -fsSL "$URL" -o executable.zip
unzip executable.zip

chmod +x flowscripter-io-cli
sudo mv flowscripter-io-cli /usr/local/bin/

cd -
rm -rf "$TMP_DIR"

echo "Installation complete! Run 'flowscripter-io-cli' to get started."
