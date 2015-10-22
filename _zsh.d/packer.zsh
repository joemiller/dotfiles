case "$OSTYPE" in
  darwin*)
    if [ -d "$HOME/Dropbox/packer-osx" ]; then
      packer_path="$HOME/Dropbox/packer-osx"
    elif [ -d "$HOME/packer-osx" ]; then
      packer_path="$HOME/packer-osx"
    fi
    ;;

  linux*)
    if [ -d "$HOME/Dropbox/packer-linux" ]; then
      packer_path="$HOME/Dropbox/packer-linux"
    elif [ -d "$HOME/packer-linux" ]; then
      packer_path="$HOME/packer-linux"
    fi
    ;;

  openbsd*)
    if [ -d "$HOME/Dropbox/packer-openbsd" ]; then
      packer_path="$HOME/Dropbox/packer-openbsd"
    elif [ -d "$HOME/packer-openbsd" ]; then
      packer_path="$HOME/packer-openbsd"
    fi
    ;;
  freebsd*)
    if [ -d "$HOME/Dropbox/packer-freebsd" ]; then
      packer_path="$HOME/Dropbox/packer-freebsd"
    elif [ -d "$HOME/packer-freebsd" ]; then
      packer_path="$HOME/packer-freebsd"
    fi
    ;;
esac

export PATH="$packer_path:$PATH"
