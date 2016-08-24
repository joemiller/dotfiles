if command -v nvim >/dev/null; then
    alias vi=nvim
    export EDITOR=nvim
else
    alias vi=vim
    export EDITOR=vim
fi

setup_vim() {
  if [ ! -d "$HOME/.vim/bundle/Vundle.vim" ] ; then
    git clone "https://github.com/gmarik/Vundle.vim.git" "$HOME/.vim/bundle/Vundle.vim"
    # install the plugins
    vim +PluginInstall +qall
  else
    echo "vim is already setup. 'rm -rf ~/.vim' and re-run setup_vim if something is wrong, or run update_vim"
  fi
}

update_vim() {
  #vim '+PluginInstall!' +qall
  vim +PluginUpdate +qall
  vim +PluginClean +qall
}

update_ycm() {
  cd ~/.vim/bundle/YouCompleteMe
  ./install.py --clang-completer --gocode-completer
  cd -
}
