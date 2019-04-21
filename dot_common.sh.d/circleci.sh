case "$OSTYPE" in
  darwin*)
    if [[ -d "$HOME/Dropbox/circleci-cli/osx" ]]; then
      circleci_path="$HOME/Dropbox/circleci-cli/osx"
    elif [[ -d "$HOME/circleci-cli/osx" ]]; then
      circleci_path="$HOME/circleci-cli/osx"
    fi
    ;;

  linux*)
    if [[ -d "$HOME/Dropbox/circleci-cli/linux" ]]; then
      circleci_path="$HOME/Dropbox/circleci-cli/linux"
    elif [[ -d "$HOME/circleci-cli/linux" ]]; then
      circleci_path="$HOME/circleci-cli/linux"
    fi
    ;;
esac

export PATH="$circleci_path:$PATH"

alias c=circleci
