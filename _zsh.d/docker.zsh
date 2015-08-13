# https://docs.docker.com/installation/mac/

function docker-env() {
  eval "$(docker-machine env default)"
}
