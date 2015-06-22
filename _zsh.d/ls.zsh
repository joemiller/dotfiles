case "$(uname)" in
    "Darwin")
        alias l.='ls -G -d .*'
        alias ll='ls -G -l'
        alias lla='ls -G -la'
        alias la='ls -G -a'
        ;;
    "OpenBSD")
        if [ -e "/usr/local/bin/colorls" ]; then
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
