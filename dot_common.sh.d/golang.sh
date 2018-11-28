if type go >/dev/null 2>&1; then
  unset GOBIN  # ensure $GOBIN is not set on onebox
  unset GOROOT
  unset GOPATH
  export GOPATH="$HOME/go"
  export GOROOT=$(go env GOROOT)
  export PATH="$PATH:$GOROOT/bin:$GOPATH/bin"
fi
