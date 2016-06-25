
function _kube_info() {
  local PREFIX="‹"
  local SUFFIX="›"
  #local COLOR="%{${FG[140]}%}"
  local COLOR="\[\033[38;5;140m\]"
  local NO_COLOR="\[\033[0m\]"

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
 echo -n "$COLOR$PREFIX$cluster_shortname$namespace$SUFFIX$NO_COLOR"
}

function _git_prompt() {
    # bail if __git_ps1 function is not defined, such as if git completion is not installed
    if ! type __git_ps1 2>&1 | grep -q 'is a function'; then
       return
    fi
    local git_status="`git status -unormal 2>&1`"
    if ! [[ "$git_status" =~ Not\ a\ git\ repo ]]; then
        if [[ "$git_status" =~ nothing\ to\ commit ]]; then
            local ansi=32
        elif [[ "$git_status" =~ nothing\ added\ to\ commit\ but\ untracked\ files\ present ]]; then
            local ansi=34
        else
            local ansi=33
        fi
        echo -n '\[\e[0;33;'"$ansi"'m\]'"$(__git_ps1)"'\[\e[0m\]'
    fi
}

function _prompt_command() {
  # PS1="[\[\033[32m\]\w\[\033[0m\]]\[\033[0m\]\n\[\033[1;36m\]\u@\[\033[0;37m\]\h] `_git_prompt` \[\033[1;33m\]-> \[\033[0m\]"
    PS1='\u@\h \W'
    # PS1='\h:\W \u'
    PS1="$PS1\[$(echo -e '\033];$(hostname -s):$(basename "$PWD")\007')\]"
    PS1="$PS1 $(_kube_info)"
    PS1="$PS1$(_git_prompt)\\$ "
    # set tmux pane title
    printf "\033k[%s/%s::%s]\033\\" "${USER}" "${HOSTNAME%%.*}" "${PWD##*/}"
}

PROMPT_COMMAND=_prompt_command

#if [ "$(uname)" = "Darwin" ]; then
#    # this will set the iterm2 tab name to 'local:<current directory>'
#    PS1="$PS1\[$(echo -e '\033];LOCAL:$(basename $PWD)\007')\] $(_git_prompt)"
#fi
