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

    local message = newState == true and "Muting microphone" or "Un-muting microphone"
    hs.notify.new( {title="Hammerspoon", subTitle=message} ):send()

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

return utils
