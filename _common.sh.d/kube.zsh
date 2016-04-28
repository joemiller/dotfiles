alias ku='kubectl'
alias kug='kubectl get'
alias kud='kubectl describe'

alias kube-cluster-list="kubectl config view -o template --template='{{range .users}}{{.name}}{{println \" \"}}{{end}}'"

alias kube-cluster01='kubectl config use-context gke_pantheon-internal_us-central1-b_cluster-01'
alias kube-panth-old_cluster='kubectl config use-context gke_pantheon-internal_us-central1-b_us-central1-b-cluster-1'

alias kube-whereami='kubectl config current-context'
