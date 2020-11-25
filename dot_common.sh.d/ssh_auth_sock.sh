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

if command -v screen; then
  alias screen="_ssh_auth_save ; $(command -v screen)"
fi

if command -v tmux; then
  alias tmux="_ssh_auth_save ; $(command -v tmux)"
fi

if command -v tmate; then
  alias tmux="_ssh_auth_save ; $(command -v tmate)"
fi
