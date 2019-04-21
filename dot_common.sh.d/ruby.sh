## new - use chruby / ruby-install
##
## brew install chruby
## brew install ruby-install
## brew install ruby
## ruby-install jruby
## ...
## source ~/.zshrc
##
## don't use system ruby, but if you do, you probably want to set GEM_HOME
##

[[ -f "/usr/local/opt/chruby/share/chruby/chruby.sh" ]] && source "/usr/local/opt/chruby/share/chruby/chruby.sh"

alias be='bundle exec'
alias bi='bundle install'

## old stuff, pre-chruby

#[ -d "$HOME/.gem/ruby/2.0.0/bin" ] && export PATH=$PATH:"$HOME/.gem/ruby/2.0.0/bin"
#export GEM_HOME="$HOME/.gem"

# jruby
#alias jrs='jruby -S'
#alias jbe='jruby -S bundle exec'
#alias jbi='jruby -S bundle install'
