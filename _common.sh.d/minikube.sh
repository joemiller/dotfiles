# download: https://github.com/kubernetes/minikube/releases

case "$OSTYPE" in
  darwin*)
    if [ -d "$HOME/Dropbox/minikube-osx" ]; then
      minikube_path="$HOME/Dropbox/minikube-osx"
    elif [ -d "$HOME/minikube-osx" ]; then
      minikube_path="$HOME/minikube-osx"
    fi
    ;;

  linux*)
    if [ -d "$HOME/Dropbox/minikube-linux" ]; then
      minikube_path="$HOME/Dropbox/minikube-linux"
    elif [ -d "$HOME/minikube-linux" ]; then
      minikube_path="$HOME/minikube-linux"
    fi
    ;;

  openbsd*)
    if [ -d "$HOME/Dropbox/minikube-openbsd" ]; then
      minikube_path="$HOME/Dropbox/minikube-openbsd"
    elif [ -d "$HOME/minikube-openbsd" ]; then
      minikube_path="$HOME/minikube-openbsd"
    fi
    ;;
  freebsd*)
    if [ -d "$HOME/Dropbox/minikube-freebsd" ]; then
      minikube_path="$HOME/Dropbox/minikube-freebsd"
    elif [ -d "$HOME/minikube-freebsd" ]; then
      minikube_path="$HOME/minikube-freebsd"
    fi
    ;;
esac

export PATH="$minikube_path:$PATH"
