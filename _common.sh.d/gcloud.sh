# on macOS, force gcloud to use /usr/bin/python which is the python2.7 that gcloud requires.
# This is necessary since homebrew switched its default python recipe to python3
if [ "$(uname)" = "Darwin" ]; then
    export CLOUDSDK_PYTHON=/usr/bin/python
fi
