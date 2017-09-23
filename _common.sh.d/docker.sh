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

# docker-install-ubuntu is a helper for installing the docker apt repos and the docker-ce deb on an ubuntu node.
# it's based on docker's official instructions as of 09/2017.
docker-install-ubuntu() {
  # allow overriding the inferred ubuntu release name
  local UBUNTU_RELEASE=${UBUNTU_RELEASE:-$(lsb_release -cs)}
  sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
  sudo add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    "$UBUNTU_RELEASE" \
    stable edge"
  sudo add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
    "$UBUNTU_RELEASE" \
    edge"
  sudo apt-get update
  sudo apt-get install docker-ce
}
