# if no arguments are given, show the current project. Else change the current project.
function gcloud-project() {
    local proj="${1:-}"
    if [ -z "$proj" ]; then
        gcloud config list project
        return
    fi
    gcloud config set project "$proj"
}
