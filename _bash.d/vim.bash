alias vi=vim
export EDITOR=vi

function setup_vim {
  if [ ! -d "$HOME/.vim/bundle/Vundle.vim" ] ; then
    git clone "https://github.com/gmarik/Vundle.vim.git" "$HOME/.vim/bundle/Vundle.vim"
    # install the plugins
    vim +PluginInstall +qall
  else
    echo "vim is already setup. 'rm -rf ~/.vim' and re-run setup_vim if something is wrong"
  fi
}
