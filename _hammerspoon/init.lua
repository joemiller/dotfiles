-- include our modules
require "app_watcher"
require "app_jump_menu"
local wifi = require "wifi_watcher"
require "auto_reloader"

-- settings
hs.window.animationDuration = 0

wifi.homeSSIDs = {"reddragon-5G", "reddragon-2G"}
wifi.autoConnectVPNs = {
    ["BREW BROS"] = "home-joeym-net (all traffic)",
    ["the brew"] = "home-joeym-net (all traffic)",
}

-- ready!
hs.notify.new( {title='Hammerspoon', subTitle='Configuration loaded successfully'} ):send()
