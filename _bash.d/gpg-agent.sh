# XXX: sort of a hack... We only want to run gpg-agent on local workstation. For now, we can probably
#      do this by only running the agent on mac osx, though this is not perfect.
if [[ "$OSTYPE" =~ darwin ]]; then
	[ -e "${HOME}/.gpg-agent-info" ] && source "${HOME}/.gpg-agent-info"
	gpg-connect-agent /bye &>/dev/null || gpg-agent --daemon &>/dev/null
	source "${HOME}/.gpg-agent-info"
	GPG_TTY=$(tty)
	export GPG_TTY
fi
