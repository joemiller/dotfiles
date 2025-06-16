alias dcc=docker-compose

# list docker images sorted by size, smallest to largest
alias docker-list-images='docker image ls --format "{{.Size}} {{.ID}} {{.Repository}}:{{.Tag}}" | LANG=en_US sort -h | column -t'
