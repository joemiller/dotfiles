alias g=git

# TODO: update pr to use the new github cli
alias pr='hub pull-request'
alias gup-master='gco master && gup'
alias gup-main='gco main && gup'

# 'git root': cd back to root of the current repo. from: https://bezhermoso.github.io/2018/07/28/jump-back-up-to-git-repo-root-directory/
alias groot='cd $(git rev-parse --show-toplevel)'
