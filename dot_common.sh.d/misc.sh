export BLOCKSIZE=k

export PAGER=less
if command -v bat > /dev/null; then
  export PAGER=bat
fi

alias rr=reset

if [[ -d "/usr/local/opt/gnu-getopt/bin" ]]; then
  PATH=/usr/local/opt/gnu-getopt/bin:$PATH
fi
