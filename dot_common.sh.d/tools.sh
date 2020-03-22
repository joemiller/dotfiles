if command -v tools >/dev/null; then
  # load shell completions
  if [[ -n "$ZSH_VERSION" ]]; then
    source <(tools zsh-completion)
  fi

  if [[ -n "$BASH_VERSION" ]]; then
    source <(tools bash-completion)
  fi
fi
