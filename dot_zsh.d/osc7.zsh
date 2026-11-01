# Report cwd to the terminal (OSC 7) so new splits/tabs open in the same dir.
_osc7_report_cwd() {
    setopt localoptions extendedglob
    local url_path=${PWD//(#m)[^A-Za-z0-9\/._~-]/%${(l:2::0:)$(([##16]#MATCH))}}
    printf '\e]7;file://%s%s\e\\' "$HOST" "$url_path"
}
autoload -Uz add-zsh-hook
add-zsh-hook chpwd _osc7_report_cwd
_osc7_report_cwd
