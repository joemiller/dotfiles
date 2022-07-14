alias ku='kubectl'
alias kug='kubectl get'
alias kud='kubectl describe'

# aliases for kubectx (brew install kubectx)
alias kctx='kubectx'
alias kns='kubens'

# setup krew
if [[ -d "$HOME/.krew/bin" ]]; then
  export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"
fi

## configure kubectl completions:
# zsh:
if [[ -n "$ZSH_VERSION" ]]; then
  if (( $+commands[kubectl] )); then
    if type _evalcache >/dev/null; then
      _evalcache kubectl completion zsh
    else
      echo "WARNING: kube.sh: evalcache not found. Consider installing it."
      source <(kubectl completion zsh)
    fi
  fi

  # kind
  if (( $+commands[kind] )); then
    if type _evalcache >/dev/null; then
      _evalcache kind completion zsh
    else
      echo "WARNING: kube.sh: evalcache not found. Consider installing it."
      source <(kind completion zsh)
    fi
  fi

  # pskube
  if (( $+commands[pskube] )); then
  # TODO: broken. fix this
    if type _evalcache >/dev/null; then
      _evalcache pskube --completion zsh
    else
  # TODO: broken. fix this
      echo "WARNING: kube.sh: evalcache not found. Consider installing it."
      source <(pskube --completion zsh)
    fi
  fi
fi

# bash:
if [[ -n "$BASH_VERSION" ]]; then
  # kubectl
  if command -v kubectl >/dev/null; then
    source <(KUBECONFIG=/dev/null kubectl completion bash)
    alias kube-completions='source <(kubectl completion bash)'
  fi

  # kind
  if command -v kind >/dev/null; then
    source <(KUBECONFIG=/dev/null kind completion bash)
  fi

  # pskube
  if command -v pskube >/dev/null; then
    source <(KUBECONFIG=/dev/null pskube --completion bash)
  fi
fi

# kubeswitch (a better/different kubectx): https://github.com/danielfoehrKn/kubeswitch
# Install with `tools install-kubeswitch`
if command -v switch.sh >/dev/null; then
  source $(command -v switch.sh)
  alias kctx='switch'
  alias kns='switch ns'
fi
