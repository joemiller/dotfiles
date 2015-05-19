case "$(uname)" in
    "Darwin"|"OpenBSD")
        alias l.='ls -G -d .*'
        alias ll='ls -G -l'
        alias lla='ls -G -la'
        alias la='ls -G -a'
        ;;
    "Linux")
        alias l.='ls -d .* --color=auto'
        alias ll='ls -l --color=auto'
        alias lla='ls -la --color=auto'
        alias la='ls -a --color=auto'
        alias joe_dstat='dstat -lpcgyrdnm'
esac

