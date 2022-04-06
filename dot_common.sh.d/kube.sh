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

# support multiple kubeconfig files by combining the standard ~/.kube/config with any files matching ~/.kube/*.kubeconfig
_extra_kubeconfigs="$(printf "%s:" $HOME/.kube/*.kubeconfig)"
export KUBECONFIG="$HOME/.kube/config:$_extra_kubeconfigs"

## configure kubectl completions:
# zsh:
if [[ -n "$ZSH_VERSION" ]]; then
  # kubectl
  if command -v kubectl >/dev/null; then
    source <(kubectl completion zsh)
    # a helper alias because this seems to constantly be breaking when loaded from .zshrc
    alias kube-completions='source <(kubectl completion zsh)'
  fi

  # kind
  if command -v kind >/dev/null; then
    source <(kind completion zsh)
  fi
fi

# bash:
if [[ -n "$BASH_VERSION" ]]; then
  # kubectl
  if command -v kubectl >/dev/null; then
    source <(kubectl completion bash)
    alias kube-completions='source <(kubectl completion bash)'
  fi

  # kind
  if command -v kind >/dev/null; then
    source <(kind completion bash)
  fi
fi

# kubeswitch (a better/different kubectx): https://github.com/danielfoehrKn/kubeswitch
if command -v brew >/dev/null; then
  if _KUBESWITCH_INSTALLATION_PATH=$(HOMEBREW_NO_AUTO_UPDATE=1 brew --prefix switch 2>/dev/null); then
    source $_KUBESWITCH_INSTALLATION_PATH/switch.sh

    # override kubectx aliases
    alias kctx='switch'
    alias kns='switch ns'
  fi
fi

