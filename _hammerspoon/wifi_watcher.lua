-- Callback function for wifi events
--
local utils = require "utils"

local wifi = {}
wifi.lastSSID = hs.wifi.currentNetwork()

-- list of home networks. Set this after requiring "wifi" modulue: wifi.homeSSIDS = {"network1", "network1-5G"}
wifi.homeSSIDs = {}

-- list of SSIDs to Tunnelblick VPN names. Upon connection to these networks try to connect to the specified VPN.
wifi.autoConnectVPNs = {}

-- event handlers
--
function wifi.onDisconnect()
    hs.notify.new({ title="Disconnected WiFi", informativeText="Wifi connection closed." }):send()
end

function wifi.onJoinHomeNetwork(newSSID)
    hs.notify.new({ title="Connected to WiFi", informativeText="Welcome home!" }):send()
end

function wifi.onJoinForeignNetwork(newSSID)
    -- mute sound output automatically
    utils.muteOutput()

    -- if we have defined an auto-connect VPN for this network, tell tunnelblick to connect
    local vpn = wifi.autoConnectVPNs[newSSID]
    if vpn then
        utils.connectTunnelblickVPN(vpn)
    end
end

-- wifi event dispatcher
--
function wifi.dispatch()
    local newSSID = hs.wifi.currentNetwork()
    local homeNetwork = false

    if not newSSID then
        wifi.onDisconnect()
        return
    end

    for _,ssid in pairs(wifi.homeSSIDs) do
        if ssid == newSSID then homeNetwork = true; break; end
    end

    if homeNetwork then
        wifi.onJoinHomeNetwork(newSSID)
    else
        wifi.onJoinForeignNetwork(newSSID)
    end

    wifi.lastSSID = newSSID
    hs.notify.new({ title="Connected to WiFi", informativeText="Now connected to " .. newSSID }):send()
end

-- create an instance and start
wifi.wifiWatcher = hs.wifi.watcher.new(wifi.dispatch)
wifi.wifiWatcher:start()

return wifi
