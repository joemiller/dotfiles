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
