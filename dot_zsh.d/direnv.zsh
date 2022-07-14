if type direnv >/dev/null; then
    if type _evalcache >/dev/null; then
        _evalcache direnv hook zsh
    else
        echo "WARNING: direnv.zsh: evalcache not found. Consider installing it."
        eval "$(direnv hook zsh)"
    fi
fi
