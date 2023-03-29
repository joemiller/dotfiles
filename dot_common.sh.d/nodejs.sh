# this is mainly for github copilot which wants nodejs 16 or higher. Set the right PATH on various machines
[[ -e "/home/linuxbrew/.linuxbrew/opt/node@16/bin" ]] && export PATH="$PATH:/home/linuxbrew/.linuxbrew/opt/node@16/bin"
[[ -e "/usr/local/opt/node@16/bin" ]] && export PATH="$PATH:/usr/local/opt/node@16/bin"
