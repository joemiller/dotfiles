# run `spectrumls` to get a quick glance at the 256 color pallette

if [[ $UID -eq 0 ]]; then CARETCOLOR="red"; else CARETCOLOR="green"; fi
if [[ $UID -eq 0 ]]; then USERPROMPT="%{$FG[179]%}root@%{$reset_color%}"; else USER=""; fi

local return_code="%(?..%{$fg[red]%}%? ↵%{$reset_color%})"

# wrap this in a func so we can call it from zle-keymap-select() when toggling vi modes to redraw
function set_prompt() {
    PROMPT='$USERPROMPT%{$FG[074]%}%m %{${fg_bold[blue]}%}%{$reset_color%}%{${FG[035]}%}%3~ $(kube_info)$(git_prompt_info)$(vi_mode)%{${fg_bold[$CARETCOLOR]}%}»%{${reset_color}%} '
}

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

# add current kubernetes cluster and namespace (if set) to the prompt.
# Prefix with `gke:` if this is a google container engine cluser.
#
#   ‹cluster-01›
#   ‹gke:cluster-01›
#   ‹gke:cluster-01/production›
#
function kube_info() {
  local PREFIX="‹"
  local SUFFIX="›"
  local CLUSTER_COLOR="%{${FG[140]}%}"
  local NS_COLOR="%{${FG[036]}%}"

  local cluster=$(kubectl config current-context 2>/dev/null)
  if [[ -z "$cluster" ]]; then
    return
  fi
  local cluster_shortname=$(awk -F_ '{print $NF}' <<< "$cluster")
  local namespace=$(kubectl config view -o jsonpath --template "{.contexts[?(@.name==\"$cluster\")].context.namespace}" 2>/dev/null)

  if [[ "$cluster" == gke* ]]; then
    local cluster_shortname="gke:$cluster_shortname"
  fi

  if [[ ! -z "$namespace" ]]; then
    namespace="/$namespace"
  fi
  echo "${CLUSTER_COLOR}${PREFIX}${cluster_shortname}${NS_COLOR}${namespace}${SUFFIX}%{${reset_color}%} "
}

# hook into visual indication when switching between vi modes
# NOTE: the cursor-shape modifier is iterm specific for macOS. other os's and terminals might be able to use $terminfo[...],
#       see this link for more info: http://unix.stackexchange.com/a/1120
# Thanks to https://hamberg.no/erlend/posts/2014-03-09-change-vim-cursor-in-iterm.html for iTerm cursor trick
function line_cursor() {
  if [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
    if [[ "$TMUX" ]]; then  # TODO: not working in tmux.. fix it.
      #printf "\033Ptmux;\033\033]50;CursorShape=1\x7\033]\\"
      printf "\033Ptmux;\033\033]50;CursorShape=1\x7"
    else
      printf "\033]50;CursorShape=1\x7"
    fi
  fi
}
function block_cursor() {
  if [[ "$TERM_PROGRAM" == "iTerm.app" ]]; then
    if [[ "$TMUX" ]]; then  # TODO: not working in tmux.. fix it.
      #printf "\033Ptmux;\033\033]50;CursorShape=0\x7\033]\\"
      printf "\033Ptmux;\033\033]50;CursorShape=0\x7"
    else
      printf "\033]50;CursorShape=0\x7"
    fi
  fi
}
function vi_mode() {
return
  case $KEYMAP in
    vicmd)
        block_cursor; echo "%{$fg_bold[yellow]%}n%{$reset_color%}" ;;
    viins|main|*)
        line_cursor; echo "%{$fg_bold[blue]%}i%{$reset_color%}" ;;
  esac
}

function zle-line-init zle-keymap-select {
  zle reset-prompt
}

# vi-mode status toggle disabled because it messes up tmux
# zle -N zle-line-init
# zle -N zle-keymap-select

# magic for tmux title bars
DISABLE_AUTO_TITLE="true"
precmd() {
  # set hostname:PWD in iterm2 title bar
  #printf "\033];$(hostname -s):$(basename "$PWD")\007"
  #printf "\033]1;%s\007" "${HOST%%.*}"
  # set tmux title
  if [[ "$TMUX" ]]; then
    printf "\033k%s\033\\" "${PWD##*/}"
  else
    printf "\033k%s::%s\033\\" "${HOST%%.*}" "${PWD##*/}"
  fi
}

# main(), sorta
set_prompt
