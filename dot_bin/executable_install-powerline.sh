#!/bin/bash
#
# Download the latest 'chezmoi' binary to ~/chezmoi for the current platform ($OSTYPE)
#

case "$OSTYPE" in
  darwin*)
    artifact_slug="darwin-amd64" ;;
  linux*)
    artifact_slug="linux-amd64" ;;
  default)
    echo "Unknown OSTYPE: $OSTYPE"
    exit 1
    ;;
esac

# https://github.com/justjanne/powerline-go/releases/download/v1.12.1/powerline-go-darwin-amd64

curl -s https://api.github.com/repos/justjanne/powerline-go/releases/latest | \
  grep browser_download | \
  grep -i "${artifact_slug}" | \
  cut -d '"' -f 4 | \
  xargs curl -L -o "$HOME/.bin/powerline-go" ;
  chmod 755 "$HOME/.bin/powerline-go"
