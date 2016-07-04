# https://docs.docker.com/installation/mac/

docker-env() {
  machine="$1"
  eval "$(docker-machine env $machine)"
}

# unset docker env vars (use this to switch to native docker.app for example)
docker-env-unset() {
  unset $(env | awk -F= '/DOCKER_/ {print $1}')
}

alias docker-cleanup-images='docker images -q --filter "dangling=true" | xargs -P8 docker rmi'
alias docker-cleanup-containers='docker rm $(docker ps -a -q)'

alias dm='docker-machine'
