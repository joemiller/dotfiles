-- general utility functions
--

local utils = {}

-- utils.muteOutput() - Mute sound output on all output devices.
--
function utils.muteOutput()
    audioDevices = hs.audiodevice.allOutputDevices()
    for i = 1, #audioDevices do
        device = audioDevices[i]
        device:setMuted(true)
    end
    hs.notify.new( {title="Hammerspoon", subTitle="Sound Muted"} ):send()
end

-- utils.toggleMicrophoneMute() - toggle mute on the default "Input Device" (probably the
-- microphone).
--
function utils.toggleMicrophoneMute()
    device = hs.audiodevice.defaultInputDevice()
    local newState = not device:muted()

    local message = newState == true and "Muted microphone" or "Un-muted microphone"
    --hs.notify.new( {title="Hammerspoon", subTitle=message} ):send()
    hs.alert.show(message, 0.5)

    device:setMuted(newState) -- true/false toggles muted state
end

-- utils.connectTunnelBlickVPN() - Use applescript to tell the running Tunnelblick
-- instance to try to connect to a VPN. The name of the VPN should match what is shown
-- in Tunnelblick's menu.
--
function utils.connectTunnelblickVPN(vpnName)
    hs.notify.new( {title="Hammerspoon", subTitle="Starting VPN connection to " .. vpnName} ):send()
    return hs.osascript.applescript(
        string.format('tell application "Tunnelblick" \
                        connect "%s" \
                      end tell', vpnName)
    )
end

-- utils.disconnectTunnelblickVPNs - disconnect all connected tunnelblick VPNs
--
function utils.disconnectTunnelblickVPNs()
    return hs.osascript.applescript(
        'tell application "Tunnelblick" \
           disconnect all \
         end tell'
    )
end

-- utils.osxVersionString()
--
function utils.osxVersionString()
    v = hs.host.operatingSystemVersion()
    return string.format("OSX %d.%d.%d", v['major'], v['minor'], v['patch'])
end

-- utils.chromeQuickTabs()
--
function utils.chromeQuickTabs()
    local chrome = hs.appfinder.appFromName("Google Chrome")
    chrome:_bringtofront()
    hs.eventtap.keyStroke({"cmd"}, "e")
end

-- utils.reconnectWireGuardVPN() - WIP
--
function utils.reconnectWireGuardVPN(vpn)
    cmd = string.format("%s/%s", hs.configdir, 'wireguard-reconnect.sh')
    msg = string.format("%s: reconnected", vpn)
    hs.task.new(
		cmd,
        function() hs.notify.new( {title="WireGuard", subTitle=msg} ):send() end,
		{vpn}
	):start()
end

return utils
