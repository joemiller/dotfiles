case "$OSTYPE" in
  darwin*)
    if [ -d "$HOME/Dropbox/helm-osx" ]; then
      helm_path="$HOME/Dropbox/helm-osx"
    elif [ -d "$HOME/helm-osx" ]; then
      helm_path="$HOME/helm-osx"
    fi
    ;;

  linux*)
    if [ -d "$HOME/Dropbox/helm-linux" ]; then
      helm_path="$HOME/Dropbox/helm-linux"
    elif [ -d "$HOME/helm-linux" ]; then
      helm_path="$HOME/helm-linux"
    fi
    ;;

  openbsd*)
    if [ -d "$HOME/Dropbox/helm-openbsd" ]; then
      helm_path="$HOME/Dropbox/helm-openbsd"
    elif [ -d "$HOME/helm-openbsd" ]; then
      helm_path="$HOME/helm-openbsd"
    fi
    ;;
  freebsd*)
    if [ -d "$HOME/Dropbox/helm-freebsd" ]; then
      helm_path="$HOME/Dropbox/helm-freebsd"
    elif [ -d "$HOME/helm-freebsd" ]; then
      helm_path="$HOME/helm-freebsd"
    fi
    ;;
esac

export PATH="$helm_path:$PATH"
