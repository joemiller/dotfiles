alias g=git

# TODO: update pr to use the new github cli
alias pr='hub pull-request'
alias gup-master='gco master && gup'
alias gup-main='gco main && gup'

# 'git root': cd back to root of the current repo. from: https://bezhermoso.github.io/2018/07/28/jump-back-up-to-git-repo-root-directory/
alias groot='cd $(git rev-parse --show-toplevel)'

# vci to use vscode for git commit message authoring
alias vci='EDITOR="code --wait" git ci'

if command wt >/dev/null 2>&1; then
    if [[ -n "$ZSH_VERSION" ]]; then
        source <(wt --init zsh)
    fi
    if [[ -n "$BASH_VERSION" ]]; then
        source <(wt --init bash)
    fi
fi
