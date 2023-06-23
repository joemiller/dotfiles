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
[[ -f "/usr/local/opt/chruby/share/chruby/auto.sh" ]] && source "/usr/local/opt/chruby/share/chruby/auto.sh"


alias be='bundle exec'
alias bi='bundle install'

case "$OSTYPE" in
  darwin*)
    # do nothing, we're using chruby on macos which should handle setting gem bin paths
    ;;

  linux*)
    if command -v ruby >/dev/null 2>&1; then
      export PATH="$(ruby -r rubygems -e 'puts Gem.user_dir')/bin:$PATH"
    fi
    ;;

  # openbsd*)
  # TODO
  #   ;;
esac
