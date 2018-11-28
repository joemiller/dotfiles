# on macOS, force gcloud to use /usr/bin/python which is the python2.7 that gcloud requires.
# This is necessary since homebrew switched its default python recipe to python3
if [ "$(uname)" = "Darwin" ]; then
    export CLOUDSDK_PYTHON=/usr/bin/python
fi

if [[ -n "$ZSH_VERSION" ]]; then
    [[ -f "$HOME/google-cloud-sdk/completion.zsh.inc" ]] && source "$HOME/google-cloud-sdk/completion.zsh.inc"
    [[ -f "$HOME/google-cloud-sdk/path.zsh.inc" ]] && source "$HOME/google-cloud-sdk/path.zsh.inc"
fi

if [[ -n "$BASH_VERSION" ]]; then
    [[ -f "$HOME/google-cloud-sdk/path.bash.inc" ]] && source "$HOME/google-cloud-sdk/path.bash.inc"
    [[ -f "$HOME/google-cloud-sdk/completion.bash.inc" ]] && source "$HOME/google-cloud-sdk/completion.bash.inc"
fi

# helpers
revoke-sa-key() {
  file="$1"
  if [[ -z "$file" ]]; then
    echo "usage: $0 file.json"
    return 1
  fi

  if [[ ! -e "$file" ]]; then
    echo "$file: file does not exist"
    return 1
  fi
  gcloud iam service-accounts keys delete "$(jq -r .private_key_id "$file")" \
                --iam-account="$(jq -r .client_email "$file")"
  rm -f -- "$file"
}
