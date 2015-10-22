# https://docs.docker.com/installation/mac/

function docker-env() {
  eval "$(docker-machine env default)"
}

alias docker-cleanup-images='docker images -q --filter "dangling=true" | xargs -P8 docker rmi'
alias docker-cleanup-containers='docker rm $(docker ps -a -q)'
