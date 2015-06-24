# run `spectrumls` to get a quick glance at the 256 color pallette

if [ $UID -eq 0 ]; then CARETCOLOR="red"; else CARETCOLOR="green"; fi
if [ $UID -eq 0 ]; then USERPROMPT="%{$FG[179]%}root@%{$reset_color%}"; else USER=""; fi

local return_code="%(?..%{$fg[red]%}%? ↵%{$reset_color%})"

PROMPT='$USERPROMPT%{$FG[074]%}%m %{${fg_bold[blue]}%}%{$reset_color%}%{${FG[035]}%}%3~ $(git_prompt_info)%{${fg_bold[$CARETCOLOR]}%}»%{${reset_color}%} '

RPS1="${return_code}"

DISABLE_UNTRACKED_FILES_DIRTY=true
ZSH_THEME_GIT_PROMPT_PREFIX="‹"
ZSH_THEME_GIT_PROMPT_SUFFIX="› %{$reset_color%}"
ZSH_THEME_GIT_PROMPT_DIRTY="%{$fg[red]%}"
ZSH_THEME_GIT_PROMPT_CLEAN="%{$fg[blue]%}"

function git_prompt_info() {
  ref=$(command git symbolic-ref HEAD 2> /dev/null) || \
  ref=$(command git rev-parse --short HEAD 2> /dev/null) || return 0
  #echo "$(parse_git_dirty)$ZSH_THEME_GIT_PROMPT_PREFIX$(current_branch)$ZSH_THEME_GIT_PROMPT_SUFFIX"
  echo "$(parse_git_dirty)$ZSH_THEME_GIT_PROMPT_PREFIX${ref#refs/heads/}$ZSH_THEME_GIT_PROMPT_SUFFIX"
}

DISABLE_AUTO_TITLE="true"
precmd() {
  # set hostname:PWD in iterm2 title bar
  #printf "\033];$(hostname -s):$(basename "$PWD")\007"
  printf "\033];%s:%s\007" "${HOST%%.*}" "${PWD##*/}"
  # set tmux title
  printf "\033k[%s/%s::%s]\033\\" "${USERNAME}" "${HOST%%.*}" "${PWD##*/}"
}
