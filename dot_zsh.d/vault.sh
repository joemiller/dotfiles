if command -v kubectl >/dev/null; then
  complete -o nospace -C /usr/local/bin/vault vault
fi
