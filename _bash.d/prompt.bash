
if [ "$(uname)" = "Darwin" ] || [ "$(uname)" = "OpenBSD" ]; then
    # this will set the iterm2 tab name to 'local:<current directory>'
    PS1="$PS1\[$(echo -e '\033];LOCAL:$(basename $PWD)\007')\]"
fi
