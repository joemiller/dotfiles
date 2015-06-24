tmux_session_title() {
  tmux set-option set-titles on
  tmux set-option set-titles-string "$@"
}
