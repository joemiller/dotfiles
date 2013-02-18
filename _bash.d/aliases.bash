case "$(uname)" in
    "Darwin"|"OpenBSD")
        alias l.='ls -d .*'
        alias ll='ls -l'
        alias lla='ls -la'
        alias la='ls -a'
        ;;
    "Linux")
        alias l.='ls -d .* --color=auto'
        alias ll='ls -l --color=auto'
        alias lla='ls -la --color=auto'
        alias la='ls -a --color=auto'
esac

