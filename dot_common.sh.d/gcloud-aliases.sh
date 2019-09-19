# if no arguments are given, show the current project. Else change the current project.
function gcloud-project() {
    local proj="${1:-}"
    if [ -z "$proj" ]; then
        gcloud config list project
        return
    fi
    gcloud config set project "$proj"
}

revoke-sa-key() {
  file="$1"
  if [[ -z "$file" ]]; then
    echo "usage: $0 file.json"
    return 1
  fi

  if [[ ! -e "$file" ]]; then
    echo "$file: file does not exist"
    return 1
  fi
  gcloud iam service-accounts keys delete "$(jq -r .private_key_id "$file")" \
                --iam-account="$(jq -r .client_email "$file")"
  rm -f -- "$file"
}
