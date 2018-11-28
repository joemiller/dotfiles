# https://gist.github.com/admackin/4507371

_ssh_auth_save() {
    #ln -sf "$SSH_AUTH_SOCK" "$HOME/.ssh/ssh-auth-sock.$HOSTNAME"
    if [[ "$SSH_AUTH_SOCK" != "$HOME/.ssh/ssh-auth-sock" ]]; then
      rm -rf "$HOME/.ssh/ssh-auth-sock"
      ln -sf "$SSH_AUTH_SOCK" "$HOME/.ssh/ssh-auth-sock"
    fi
}
#alias screen='_ssh_auth_save ; export HOSTNAME=$(hostname) ; screen'
#alias tmux='_ssh_auth_save ; export HOSTNAME=$(hostname) ; tmux'

alias screen='_ssh_auth_save ; screen'
alias tmux='_ssh_auth_save ; tmux'
alias tmate='_ssh_auth_save ; tmate'
