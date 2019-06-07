hacking
=======

Use this directory for setting up temporary home directories on different
linux distros for testing dotfiles without risking your real home dir.

Usage
-----

Build and run one of the docker images. A zsh shell will be started.

fedora-29:

```console
docker build -t joemiller/dotfiles-f29 -f ./Dockerfile.fedora-29 .
docker run --rm -it  joemiller/dotfiles-f29
```

ubuntu 18.10:

```console
docker build -t joemiller/dotfiles-ubuntu-1810 -f ./Dockerfile.ubuntu-18.10 .
docker run --rm -it  joemiller/dotfiles-ubuntu-1810
```

After the container is running install chezmoi and dotfiles inside the container:

```console
[joe@5b687311a692]~% curl -L https://raw.githubusercontent.com/joemiller/dotfiles/master/install-chezmoi.sh | bash
[joe@5b687311a692]~% sudo mv chezmoi /usr/local/bin

[joe@5b687311a692]~% chezmoi init https://github.com/joemiller/dotfiles.git
[joe@5b687311a692]~% chezmoi apply

[joe@5b687311a692]~% source ~/.zshrc
```
