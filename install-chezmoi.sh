#!/bin/bash
#
# Download the latest 'chezmoi' binary to ~/chezmoi for the current platform ($OSTYPE)
#

case "$OSTYPE" in
  darwin*)
    artifact_slug="darwin_amd64" ;;
  linux*)
    artifact_slug="linux_amd64" ;;
  openbsd*)
    artifact_slug="openbsd_amd64" ;;
  default)
    echo "Unknown OSTYPE: $OSTYPE"
    exit 1
    ;;
esac

curl -s https://api.github.com/repos/twpayne/chezmoi/releases/latest | \
    grep browser_download | \
    grep -i "${artifact_slug}.tar.gz" | \
    cut -d '"' -f 4 | \
    xargs curl -L | \
    tar -xvzf - chezmoi
