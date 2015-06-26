my dotfiles
===========

Usage
-----

### Install
clones this repo ~/.dotfiles and sets up symlinks.

    curl -L https://raw.github.com/joemiller/dotfiles/master/install | bash

### Update
Pulls down any changes from github then sets up symlinks.

    cd ~/.dotfiles
    ./install

Skip all git actions with `-n` flag:

    ./install -n

This is useful when used with something like my `dotfiles` chef recipe
which handles sync'ing with git already:
https://github.com/joemiller/workstation-bootstrap/blob/master/cookbooks/dotfiles/recipes/default.rb

### Commit new changes and push them to github

The standard git dance:

    git add .
    git commit -a -m'new stuff'
    git push 
