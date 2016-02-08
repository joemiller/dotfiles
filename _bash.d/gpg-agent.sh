[ -e "${HOME}/.gpg-agent-info" ] && source "${HOME}/.gpg-agent-info"
gpg-connect-agent /bye &>/dev/null || gpg-agent --daemon &>/dev/null
source "${HOME}/.gpg-agent-info"
