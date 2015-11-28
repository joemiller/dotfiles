[ -d "$HOME/.gem/ruby/2.0.0/bin" ] && export PATH=$PATH:"$HOME/.gem/ruby/2.0.0/bin"
export GEM_HOME="$HOME/.gem"

alias be='bundle exec'
alias bi='bundle install'

# jruby
alias jrs='jruby -S'
alias jbe='jruby -S bundle exec'
alias jbi='jruby -S bundle install'
