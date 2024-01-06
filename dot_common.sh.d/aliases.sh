case "$(uname)" in
    "Darwin")
        # alias ls='exa'
        alias l.='ls -G -d .*'
        alias ll='ls -G -l'
        alias lla='ls -G -la'
        alias la='ls -G -a'
        alias top='top -o cpu' # because top should sort by cpu usage, by default, IMHO
        alias pbcopy='reattach-to-user-namespace pbcopy'
        alias tailscale='/Applications/Tailscale.app/Contents/MacOS/Tailscale'
        ;;
    "OpenBSD")
        # OpenBSD 5.8+ replaces sudo with doas in the base system. sudo can optionally be installed from ports.
        # If doas is available and sudo is not, alias sudo to doas
        if [[ -e "/usr/bin/doas" ]] && [[ ! -e "/usr/local/bin/sudo" ]]; then
          alias sudo='doas'
        fi
        if [[ -e "/usr/local/bin/colorls" ]]; then
          alias l.='/usr/local/bin/colorls -G -d .*'
          alias ll='/usr/local/bin/colorls -G -l'
          alias lla='/usr/local/bin/colorls -G -la'
          alias la='/usr/local/bin/colorls -G -a'
        else
          alias l.='ls -d .*'
          alias ll='ls -l'
          alias lla='ls -la'
          alias la='ls -a'
        fi
        ;;
    "Linux")
        alias l.='ls -d .* --color=auto'
        alias ll='ls -l --color=auto'
        alias lla='ls -la --color=auto'
        alias la='ls -a --color=auto'
        alias joe_dstat='dstat -lpcgyrdnm'
esac
