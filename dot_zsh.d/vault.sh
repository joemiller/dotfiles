if command -v vault >/dev/null; then
  complete -o nospace -C /usr/local/bin/vault vault
fi
