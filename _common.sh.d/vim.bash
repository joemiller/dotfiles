alias vi=vim
export EDITOR=vim

function setup_vim {
  if [ ! -d "$HOME/.vim/bundle/Vundle.vim" ] ; then
    git clone "https://github.com/gmarik/Vundle.vim.git" "$HOME/.vim/bundle/Vundle.vim"
    # install the plugins
    vim +PluginInstall +qall
  else
    echo "vim is already setup. 'rm -rf ~/.vim' and re-run setup_vim if something is wrong, or run update_vim"
  fi
}

function update_vim {
  #vim '+PluginInstall!' +qall
  vim +PluginUpdate +qall
  vim +PluginClean +qall
}

function update_ycm {
  cd ~/.vim/bundle/YouCompleteMe
  ./install.py --clang-completer --gocode-completer
  cd -
}
