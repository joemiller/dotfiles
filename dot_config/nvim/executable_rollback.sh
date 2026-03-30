#!/usr/bin/env bash
set -eou pipefail
rm -f ~/.config/nvim/init.lua
rm -rf ~/.config/nvim/lua
ln -sf ~/.neovim.init.vim ~/.config/nvim/init.vim
echo "Rolled back to vim-plug config."
echo "To clean up lazy.nvim data: rm -rf ~/.local/share/nvim/lazy ~/.local/state/nvim/lazy"
