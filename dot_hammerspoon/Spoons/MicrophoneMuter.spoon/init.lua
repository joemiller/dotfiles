-- TODO:
-- find/make icons
-- find a guide on making a spoon repo
-- make github repo
-- document the code according to the spoon standards
-- make the docs.json thing
-- readme
-- convert my own init.lua to download the spoon
-- NOTE: stopped developing this after i discovered mutify app for macos

local obj={}

obj.__index = obj

-- Metadata
obj.name = "MicrophoneMuter"
obj.version = "0.0.1"
obj.author = "Joe Miller <joe@joemiller.me>"
obj.homepage = "https://github.com/joemiller/TODO" -- TODO
obj.license = "MIT - https://opensource.org/licenses/MIT"

obj.logger = hs.logger.new('MicrophoneMuter')

-- TODO: hide local vars
-- TODO: allow overriding the input device

-- Periodically check the status of the microphone in case it was toggled by another application
obj.refresh_interval = 10
obj.timer = nil

obj.menuBarItem = nil

-- toggleMicrophoneMute() - toggle mute on the default "Input Device" (probably the
-- microphone).
function obj:toggleMicrophoneMute()
    device = hs.audiodevice.defaultInputDevice()
    local newState = not device:muted()

    local message = newState == true and "Muted microphone" or "Un-muted microphone"
    hs.alert.show(message, 0.7)

    device:setMuted(newState) -- true/false toggles muted state
    self:refresh()
    return self
end

function obj:refresh()
    self.logger.d("refresh called")

    if (not self.menuBarItem) then
        self.menuBarItem = hs.menubar.new()
    end

    device = hs.audiodevice.defaultInputDevice()
    local muted = device:muted()

    if muted then
        self.menuBarItem:setTitle("off")
        -- self.menuBarItem:setIcon()
    else
        self.menuBarItem:setTitle("on")
        -- self.menuBarItem:setIcon()
    end

    return self
end

-- function obj:init()
--     self:refresh()
--     self.logger.d("initialized", self.name)
-- end

function obj:start()
    self:stop()
    self:refresh()
    self.timer = hs.timer.doEvery(self.refresh_interval, function() self:refresh() end)
end

function obj:stop()
    if self.menuBarItem then
        self.menuBarItem:delete()
    end
    if self.timer then
        self.timer:stop()
    end
end

function obj:bindHotkeys(mapping)
   local hotkeyDefinitions = {
       toggle = hs.fnutils.partial(self.toggleMicrophoneMute, self)
   }
   hs.spoons.bindHotkeysToSpec(hotkeyDefinitions, mapping)
   return self
end

return obj
