# Only run gpg-agent on the Mac workstation. Remote hosts use the forwarded ssh agent
# (see ~/.ssh/rc). Don't key this off SSH_CLIENT: multiplexer servers (tmux, herdr, rex)
# outlive the ssh login and their shells don't have it.

if [[ "$OSTYPE" == darwin* ]]; then
  # gpg < 2.1, use gpg-connect-agent
  #[ -e "${HOME}/.gpg-agent-info" ] && source "${HOME}/.gpg-agent-info"
  #gpg-connect-agent /bye &>/dev/null || gpg-agent --daemon &>/dev/null
	#source "${HOME}/.gpg-agent-info"

  # gpg >= 2.1, use gpgconf
  gpgconf --launch gpg-agent
  if [ "${gnupg_SSH_AUTH_SOCK_by:-0}" -ne $$ ]; then
      export SSH_AUTH_SOCK="$(gpgconf --list-dirs agent-ssh-socket)"
  fi

  GPG_TTY=$(tty)
  export GPG_TTY

  alias restart_gpg_agent="gpgconf --kill gpg-agent; killall -9 gpg-agent ; gpgconf --launch gpg-agent"
fi

if [[ "$OSTYPE" =~ darwin ]] && type gpg2 >/dev/null 2>&1; then
  alias gpg=gpg2
fi
