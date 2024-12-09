[ -d "$HOME/.ps-toolbox/bin" ] && export PATH="$HOME/.ps-toolbox/bin:$PATH"

alias pk=pskube
alias psk=pskube

psk-psid2name() {
  local _psid="$1"
  pskube --list-json | jq --arg psid "$_psid" -r '.[] | select(.psID == $psid) | .name'
}

psk-psid2alias() {
  local _psid="$1"
  pskube --list-json | jq --arg psid "$_psid" -r '.[] | select(.psID == $psid) | .alias'
}

psk-alias2psid() {
  local _alias="$1"
  pskube --list-json | jq --arg alias "$_alias" -r '.[] | select(.alias == $alias) | .psID'
}

psk-alias2name() {
  local _alias="$1"
  pskube --list-json | jq --arg alias "$_alias" -r '.[] | select(.alias == $alias) | .name'
}

psk-name2psid() {
  local _name="$1"
  pskube --list-json | jq --arg name "$_name" -r '.[] | select(.name == $name) | .psID'
}
