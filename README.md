my dotfiles
===========

These are my dotfiles. I do not recommend installing this repo as-is! Please
clone them and modify or take bits and pieces.

These dotfiles are managed with [chezmoi](https://github.com/twpayne/chezmoi).

> The state of this repo before converting to chezmoi is available on the "before-chezmoi" tag
> https://github.com/joemiller/dotfiles/tree/before-chezmoi

Install
-------

### Install chezmoi

macOS:

```console
brew install twpayne/taps/chezmoi
```

Linux / other:

```console
curl -L https://raw.githubusercontent.com/joemiller/dotfiles/master/install-chezmoi.sh | bash
sudo mv chezmoi /usr/local/bin
```

Install 1password (`op` binary). This is optional if you're not me.  You will be
prompted `Enable templates that require 1password? y/n? n` when running `chezmoi init` later.
Enter `n` if you do not intend to use 1password. This will prevent the rendering
of 1password secrets.

The files that use 1password secrets can be find by running `grep -R onepassword .`.

### Install dotfiles

Run `chezmoi init` to clone this repo to `~/.local/share/chezmoi`:

```console
chezmoi init https://github.com/joemiller/dotfiles.git
```

Check out the `~/.config/chezmoi/chezmoi.toml` config file and customize it for the local machine:

```console
chezmoi edit-config
```

Deploy rendered dotfiles:

> TIP: Run `chezmoi diff` before apply to see the changes chezmoi will make

```console
chezmoi apply
```

### setup zsh environment

```console
source ~/.zshrc
```

### install powerline-go

The zsh theme will attempt to use [powerline-go](https://github.com/justjanne/powerline-go)
if it's available in $PATH. If not available it falls back to a simpler theme.

powerline-go can be installed by running:

```console
install-powerline.sh
# alternatively, if ~/.bin is not in $PATH:
~/.bin/install-powerline.sh
```

### vim / neovim

Install neovim / vim plugins:

```console
# neovim
setup_nvim
update_nvim

# vim
setup_vim
update_vim
```

Hacking
-------

The `./hacking` directory contains sample Dockerfiles useful for standing up a temporary environment for
testing chezmoi without risking your existing dotfile setup.
