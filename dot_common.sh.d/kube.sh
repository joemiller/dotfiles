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

if [[ -d "$HOME/git/planetscale/kubectl-plugins/plugins" ]]; then
 export PATH="$PATH:$HOME/git/planetscale/kubectl-plugins/plugins"
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

  # # pskube
  # Follow kubernetes own recommendation here:
  #   `pskube --completion zsh >${fpath[1]}/_pskube`  (or /usr/local/share/zsh/site-functions/ if that dir exists)
  #
  # if (( $+commands[pskube] )); then
  # # TODO: broken. fix this
  #   if type _evalcache >/dev/null; then
  #     _evalcache pskube --completion zsh
  #   else
  # # TODO: broken. fix this
  #     echo "WARNING: kube.sh: evalcache not found. Consider installing it."
  #     source <(pskube --completion zsh)
  #   fi
  # fi
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
if command -v brew >/dev/null; then
  switch_install_path=$(brew --prefix switch) && source "$switch_install_path/switch.sh"
  alias kctx='switch'
  alias kns='switch ns'
  alias kctx-u='switch --unset'
fi

if [[ -d "$HOME/git/planetscale/kubectl-plugins/plugins" ]]; then
  export PATH="$PATH:$HOME/git/planetscale/kubectl-plugins/plugins"
fi
