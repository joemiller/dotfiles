if [[ -n "$ZSH_VERSION" ]]; then
    [[ -f "$HOME/google-cloud-sdk/completion.zsh.inc" ]] && source "$HOME/google-cloud-sdk/completion.zsh.inc"
    [[ -f "$HOME/google-cloud-sdk/path.zsh.inc" ]] && source "$HOME/google-cloud-sdk/path.zsh.inc"
fi

if [[ -n "$BASH_VERSION" ]]; then
    [[ -f "$HOME/google-cloud-sdk/path.bash.inc" ]] && source "$HOME/google-cloud-sdk/path.bash.inc"
    [[ -f "$HOME/google-cloud-sdk/completion.bash.inc" ]] && source "$HOME/google-cloud-sdk/completion.bash.inc"
fi
