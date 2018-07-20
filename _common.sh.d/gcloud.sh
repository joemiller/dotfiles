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
