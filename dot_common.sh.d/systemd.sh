if type systemctl >/dev/null 2>&1; then
  # Systemctl helpers, because typing 'systemctl' a lot is no fun
  alias status='systemctl status'
  alias start='systemctl start'
  alias stop='systemctl stop'
  alias restart='systemctl restart'
  alias failed='systemctl --failed --full'
  alias units='systemctl --full --all'
  alias sc='systemctl'
fi
