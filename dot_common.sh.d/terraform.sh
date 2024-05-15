case "$OSTYPE" in
  darwin*)
    if [ -d "$HOME/Dropbox/terraform-osx" ]; then
      terraform_path="$HOME/Dropbox/terraform-osx"
    elif [ -d "$HOME/terraform-osx" ]; then
      terraform_path="$HOME/terraform-osx"
    fi
    ;;

  linux*)
    if [ -d "$HOME/Dropbox/terraform-linux" ]; then
      terraform_path="$HOME/Dropbox/terraform-linux"
    elif [ -d "$HOME/terraform-linux" ]; then
      terraform_path="$HOME/terraform-linux"
    fi
    ;;

  openbsd*)
    if [ -d "$HOME/Dropbox/terraform-openbsd" ]; then
      terraform_path="$HOME/Dropbox/terraform-openbsd"
    elif [ -d "$HOME/terraform-openbsd" ]; then
      terraform_path="$HOME/terraform-openbsd"
    fi
    ;;
  freebsd*)
    if [ -d "$HOME/Dropbox/terraform-freebsd" ]; then
      terraform_path="$HOME/Dropbox/terraform-freebsd"
    elif [ -d "$HOME/terraform-freebsd" ]; then
      terraform_path="$HOME/terraform-freebsd"
    fi
    ;;
esac

export PATH="$terraform_path:$PATH"

alias tf=terraform
alias tfw='terraform workspace'

alias tg=terragrunt
# XXX: the last version of terragrunt that didn't have horendous performance issues:
alias tg55=terragrunt-0.55.5
