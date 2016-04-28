# run `spectrumls` to get a quick glance at the 256 color pallette

if [ $UID -eq 0 ]; then CARETCOLOR="red"; else CARETCOLOR="green"; fi
if [ $UID -eq 0 ]; then USERPROMPT="%{$FG[179]%}root@%{$reset_color%}"; else USER=""; fi

local return_code="%(?..%{$fg[red]%}%? ↵%{$reset_color%})"

PROMPT='$USERPROMPT%{$FG[074]%}%m %{${fg_bold[blue]}%}%{$reset_color%}%{${FG[035]}%}%3~ $(kube_info)$(git_prompt_info)%{${fg_bold[$CARETCOLOR]}%}»%{${reset_color}%} '

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
  local COLOR="%{${FG[140]}%}"

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
  echo "$COLOR$PREFIX$cluster_shortname$namespace$SUFFIX%{${reset_color}%} "
}

DISABLE_AUTO_TITLE="true"
precmd() {
  # set hostname:PWD in iterm2 title bar
  #printf "\033];$(hostname -s):$(basename "$PWD")\007"
  #printf "\033]1;%s\007" "${HOST%%.*}"
  # set tmux title
  if [ "$TMUX" ]; then
    printf "\033k%s\033\\" "${PWD##*/}"
  else
    printf "\033k%s::%s\033\\" "${HOST%%.*}" "${PWD##*/}"
  fi
}
