# support for perl local::lib if installed
# to setup perl local::lib and cpannm command:
#    $ cpan App::cpanminus
#
# http://www.cpan.org/modules/INSTALL.html

# NOTE! cpanm will default to "$HOME/perl5" but we use "$HOME/.perl5" instead!!

CPANM_BASEDIR="$HOME/.perl5"

if [[ -e "$CPANM_BASEDIR/bin" ]]; then
    PATH="$CPANM_BASEDIR/bin${PATH:+:${PATH}}"; export PATH;
    PERL5LIB="$CPANM_BASEDIR/lib/perl5${PERL5LIB:+:${PERL5LIB}}"; export PERL5LIB;
    PERL_LOCAL_LIB_ROOT="$CPANM_BASEDIR${PERL_LOCAL_LIB_ROOT:+:${PERL_LOCAL_LIB_ROOT}}"; export PERL_LOCAL_LIB_ROOT;
    PERL_MB_OPT="--install_base \"$CPANM_BASEDIR\""; export PERL_MB_OPT;
    PERL_MM_OPT="INSTALL_BASE=$CPANM_BASEDIR"; export PERL_MM_OPT;
fi
