alias ku='kubectl'
alias kug='kubectl get'
alias kud='kubectl describe'

# aliases for kubectx (TODO link)
alias kctx='kubectx'
alias kns='kube-ns'

alias kube-whereami='kubectl config current-context'

# load shell completions
if [[ -n "$ZSH_VERSION" ]]; then
    source <(kubectl completion zsh)
    # a helper alias because this seems to constantly be breaking when loaded from .zshrc
    alias kube-completions='source <(kubectl completion zsh)'
fi

if [[ -n "$BASH_VERSION" ]]; then
    source <(kubectl completion bash)
fi
