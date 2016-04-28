alias ku='kubectl'
alias kug='kubectl get'
alias kud='kubectl describe'

alias kube-cluster-list="kubectl config view -o template --template='{{range .users}}{{.name}}{{println \" \"}}{{end}}'"

alias kube-cluster01='kubectl config use-context gke_pantheon-internal_us-central1-b_cluster-01'
alias kube-panth-old_cluster='kubectl config use-context gke_pantheon-internal_us-central1-b_us-central1-b-cluster-1'

alias kube-whereami='kubectl config current-context'

# set default namespace
function kube-setns {
  if [ -z "$1" ] ; then
    echo "provide the namespace name you want to switch to default"
    return
  fi
  set -e
  local CONTEXT=$(kubectl config current-context)
  kubectl config set-context "$CONTEXT" --namespace="$1"
  set +e
}

