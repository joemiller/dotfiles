tmux_session_title() {
  tmux set-option set-titles on
  tmux set-option set-titles-string "tmux: $1"
  tmux rename-session "$1"
}

tmate_session_title() {
  tmate set-option set-titles on
  tmate set-option set-titles-string "tmate: $1"
  tmate rename-session "$1"
}
