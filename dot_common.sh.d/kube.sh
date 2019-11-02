alias ku='kubectl'
alias kug='kubectl get'
alias kud='kubectl describe'

# aliases for kubectx (TODO link)
alias kctx='kubectx'
alias kns='kube-ns'

alias tools-kube-whereami='kubectl config current-context'

if command -v kubectl >/dev/null; then
  # load shell completions
  if [[ -n "$ZSH_VERSION" ]]; then
      source <(kubectl completion zsh)
      # a helper alias because this seems to constantly be breaking when loaded from .zshrc
      alias kube-completions='source <(kubectl completion zsh)'
  fi

  if [[ -n "$BASH_VERSION" ]]; then
      source <(kubectl completion bash)
  fi
fi

if [[ -d "$HOME/.krew/bin" ]]; then
  export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"
fi

# kubectl krew install config-cleanup
# https://github.com/b23llc/kubectl-config-cleanup
alias tools-kubeconfig-cleanup='cp ~/.kube/config ~/.kube/config.bak && kubectl config-cleanup --raw -t10 > ~/.kube/config-cleaned && mv ~/.kube/config-cleaned ~/.kube/config'
