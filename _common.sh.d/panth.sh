jenkins() {
  host=$1
  if [ -z "$host" ]; then
    echo "usage: jenkins <short-hostname>"
    return 1
  fi
  open "https://$host.panth.io:8090/jenkins"
}
alias jenk=jenkins

psh() {
  host=$1
  if [ -z "$host" ]; then
    echo "usage: psh <short-hostname>"
    return 1
  fi
  ssh "$host.panth.io"
}

alias kube-panth-internal='kubectl config use-context gke_pantheon-internal_us-central1-b_us-central1-b-cluster-1'
