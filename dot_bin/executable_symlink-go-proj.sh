#!/bin/bash

set -eou pipefail

ORGS=(joemiller pantheon-systems)

for org in ${ORGS[*]}; do
    cd "$HOME/git/$org"
    for p in $HOME/go/src/github.com/$org/*; do
        if [[ -d "$p" ]]; then
            echo "$p"
            ln -sf "$p" "$(basename "$p")"
        fi
    done
done
