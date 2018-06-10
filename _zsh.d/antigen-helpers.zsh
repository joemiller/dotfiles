# use this because 'antigen selfupdate' does not work in this configuration
# https://github.com/zsh-users/antigen/wiki/Installation
antigen-selfupdate() {
  curl -L git.io/antigen > "$HOME/.dotfiles/antigen.zsh"
}
