-- a few window modification functions. Most functions have been retired/removed
-- since the 'WindowHalfsAndThirds' spoon provides similar functionality
local winmod = {}

local utils = require "utils"

local direction = {
  left = 0, right = 1, up = 2, down = 3
}
-- export direction:
winmod.direction = direction

local log = hs.logger.new('winmod','debug')

-- Window cache for window maximize toggler
local frameCache = {}

function winmod.resize(direction, pct)
    local win = hs.window.focusedWindow()
    local f = win:frame()

    -- if     direction == direction.left  then f.w = f.w - (f.w * pct)
    -- elseif direction == direction.right then f.w = f.w + (f.w * pct)
    -- elseif direction == direction.up    then f.h = f.h - (f.h * pct)
    -- elseif direction == direction.down  then f.h = f.h + (f.h * pct)
    if     direction == 0 then f.w = f.w - (f.w * pct)
    elseif direction == 1 then f.w = f.w + (f.w * pct)
    elseif direction == 2 then f.h = f.h + (f.h * pct)
    elseif direction == 3 then f.h = f.h - (f.h * pct)
    end
    win:setFrameInScreenBounds(f)
end

-- TODO(joe): don't allow moving if any part of the window would move out of the screen
-- TODO(joe): if x or y is 0 then the window won't move cuz 0 * pct is always 0.. maybe just change to pixels
function winmod.move(direction, pct)
    local win = hs.window.focusedWindow()
    local f = win:frame()

    -- if     direction == direction.left  then f.w = f.w - (f.w * pct)
    -- elseif direction == direction.right then f.w = f.w + (f.w * pct)
    -- elseif direction == direction.up    then f.h = f.h - (f.h * pct)
    -- elseif direction == direction.down  then f.h = f.h + (f.h * pct)
    if     direction == 0 then f.x = f.x - 50 -- (f.x * pct)
    elseif direction == 1 then f.x = f.x + 50 -- (f.x * pct)
    elseif direction == 2 then f.y = f.y - 50 -- (f.y * pct)
    elseif direction == 3 then f.y = f.y + 50 -- (f.y * pct)
    end
    win:setFrameInScreenBounds(f)
end

-- This sets the current window to the max size of the built-in macbook laptop screen, no matter
-- what display the current screen is on.
--
-- Use Case: I like my browser windows to be the same size for some reason. This size is usually
-- maximum on the built-in screen. Even when I move the window to a larger monitor I like the size to
-- be the same as when it was on the built-in screen.
function winmod.currentWindowToSizeOfLaptopScreen()
    local win = hs.window.focusedWindow()
    local f = win:frame()
    local screen = win:screen():frame()
    local builtInScreen = hs.screen('Color LCD')
    local max = builtInScreen:frame()

    frameCache[win:id()] = f  -- cache previous window position
    -- if the window is already on the builtin laptop screen, set it's position to 0,0 on the screen
    -- since it is the same size and would be out of view if placed anywhere else
    if win:screen() == builtInScreen then
        f.x = screen.x
        f.y = screen.y
    end
    f.w = max.w
    f.h = max.h
    win:setFrame(f)
end

function winmod.currentWindowToNextScreen()
    local win = hs.window.focusedWindow()
    local curScreen = win:screen()
    win:moveToScreen(curScreen:next(), true, true)
end

-- move the current window to the next monitor including all windows belonging to the same app
-- Use case: quickly move all Chrome windows to a specific screen
function winmod.currentAppAllWindowsToNextScreen()
    local win = hs.window.focusedWindow()
    local app = hs.application.frontmostApplication()
    local curScreen = win:screen()
    hs.fnutils.each(app:allWindows(),
        function(win)
            if curScreen ~= win:screen():next() then
                win:moveToScreen(win:screen():next(), true, true)
            end
        end
    )
end


-- function winmod.focusWindowWest()
--     local win = hs.window.focusedWindow()
--     local f = hs.window.filter.new():setAppFilter(hs.application.frontmostApplication())
--     win.focusWindowWest(f.name)
-- end

return winmod
