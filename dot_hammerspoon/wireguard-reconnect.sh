#!/bin/bash

set -eou pipefail

main() {
  vpn="${1:-}"

  if [[ -z "$vpn" ]]; then
    echo "ERROR: missing vpn name"
    echo "Usage: $0 [vpn-name]"
    exit 1
  fi

  while [[ "$(scutil --nc status "$vpn" | head -n1)"  != "Disconnected" ]]; do
    scutil --nc stop "$vpn"
    sleep 1
  done

  scutil --nc start "$vpn"
}
main "$@"
