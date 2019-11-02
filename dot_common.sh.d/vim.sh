# if command -v nvim >/dev/null; then
#     alias vi=nvim
#     export EDITOR=nvim
# else
#     alias vi=vim
#     export EDITOR=vim
# fi

export EDITOR=vim
if command -v nvim >/dev/null 2>&1; then
  export EDITOR=nvim
fi

## regular vim helpers
tools-setup_vim() {
  if [[ ! -d "$HOME/.vim/bundle/Vundle.vim" ]]; then
    git clone "https://github.com/gmarik/Vundle.vim.git" "$HOME/.vim/bundle/Vundle.vim"
    # install the plugins
    vim +PluginInstall +qall
  else
    echo "vim is already setup. 'rm -rf ~/.vim' and re-run setup_vim if something is wrong, or run update_vim"
  fi
}

tools-update_vim() {
  #vim '+PluginInstall!' +qall
  vim +PluginUpdate +qall
  vim +PluginClean +qall
}

tools-update_vim_ycm() {
  cd ~/.vim/bundle/YouCompleteMe
  ./install.py --clang-completer --gocode-completer
  cd -
}

## neovim helpers
tools-setup_nvim() {
  echo "==> Symlinking $HOME/.neovim.init.vim -> $HOME/.config/nvim/init.vim"
  [[ ! -e "$HOME/.config/nvim" ]] && mkdir -p "$HOME/.config/nvim"
  [[ ! -e "$HOME/.config/nvim/init.vim" ]] && ln -sf "$HOME/.neovim.init.vim" "$HOME/.config/nvim/init.vim"

  if [[ ! -e "$HOME/.local/share/nvim/site/autoload/plug.vim" ]]; then
    echo "==> Installing vim-plug"
    # install vim-plug - https://github.com/junegunn/vim-plug
    curl -fLo "$HOME/.local/share/nvim/site/autoload/plug.vim" --create-dirs \
      https://raw.githubusercontent.com/junegunn/vim-plug/master/plug.vim
  fi
  update_nvim
}

tools-update_nvim() {
  echo "==> Installing/upgrading neovim python modules"
  if command -v pip3 > /dev/null; then
    pip3 install --upgrade neovim
  fi
  if command -v pip2 > /dev/null; then
    pip2 install --upgrade neovim
  fi
  if command -v pip > /dev/null; then
    pip install --upgrade neovim
  fi

  echo "==> Updating nvim plugins"
  nvim +PlugUpdate +qall
  nvim +UpdateRemotePlugins +qall
  nvim +PlugClean +qall
}
