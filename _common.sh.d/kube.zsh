alias ku='kubectl'
alias kug='kubectl get'

alias kube-cluster-list="kubectl config view -o template --template='{{range .users}}{{.name}}{{println \" \"}}{{end}}'"
