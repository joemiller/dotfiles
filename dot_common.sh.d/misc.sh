export BLOCKSIZE=k

export PAGER=less
if command -v bat > /dev/null; then
  export PAGER=bat
  alias more=bat
fi

alias rr=reset

if [[ -d "/usr/local/opt/gnu-getopt/bin" ]]; then
  PATH=/usr/local/opt/gnu-getopt/bin:$PATH
fi

# the gcloud cli (/usr/lib/google-cloud-sdk/lib/googlecloudsdk/command_lib/util/check_browser.py) will
# refuse to attempt opening a browser unless one of 'DISPLAY', 'WAYLAND_DISPLAY', 'MIR_SOCKET' is set
# so we set DISPLAY to a dummy value if it's not set (ie: not running under x11) so that our special
# opener/xdg-open script can still work:
if [[ -z "${DISPLAY-}" ]]; then
  export DISPLAY=dummy
fi
