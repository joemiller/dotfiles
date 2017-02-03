-- TODO: DRY this up

local winmod = {}

local log = hs.logger.new('winmod','debug')

-- Window cache for window maximize toggler
local frameCache = {}

-- Toggle current window between its normal size, and being maximized
function winmod.toggleMaximized()
    local win = hs.window.focusedWindow()
    if (win == nil) or (win:id() == nil) then
        return
    end
    if frameCache[win:id()] then
        win:setFrame(frameCache[win:id()])
        frameCache[win:id()] = nil
    else
        frameCache[win:id()] = win:frame()
        win:maximize()
    end
end

-- TODO: function winmod.windowPreviousPosition()
-- toggle window's previous position/current position (like the jump/last button on your TV remote)
-- could probably re-use frameCache for this
function winmod.windowPreviousPosition()
	local win = hs.window.focusedWindow()

    if (win == nil) or (win:id() == nil) then
        return
    end
    if frameCache[win:id()] then
        local previous = win:frame()
        win:setFrame(frameCache[win:id()])
        frameCache[win:id()] = previous
    end
end

function winmod.currentWindowToLeftHalf()
	local win = hs.window.focusedWindow()
	local f = win:frame()
	local screen = win:screen()
	local max = screen:frame()

    frameCache[win:id()] = f  -- cache previous window position
	f.x = max.x
	f.y = max.y
	f.w = max.w / 2
	f.h = max.h
	win:setFrame(f)
end

function winmod.currentWindowToRightHalf()
    local win = hs.window.focusedWindow()
    local f = win:frame()
    local screen = win:screen()
    local max = screen:frame()

    frameCache[win:id()] = f  -- cache previous window position
    f.x = max.x + (max.w / 2)
    f.y = max.y
    f.w = max.w / 2
    f.h = max.h
    win:setFrame(f)
end

function winmod.currentWindowToLeft()
    local win = hs.window.focusedWindow()
    local f = win:frame()
    local screen = win:screen()
    local screenFrame = screen:frame()

    frameCache[win:id()] = f  -- cache previous window position
    f.x = screenFrame.x
    win:setFrame(f)
end

function winmod.currentWindowToRight()
    local win = hs.window.focusedWindow()
    local f = win:frame()
    local screen = win:screen()
    local screenFrame = screen:frame()

    frameCache[win:id()] = f  -- cache previous window position
    f.x = ((screenFrame.x + screenFrame.w) - f.w)
    win:setFrame(f)
end

function winmod.currentWindowToTop()
    local win = hs.window.focusedWindow()
    local f = win:frame()
    local screen = win:screen()
    local screenFrame = screen:frame()

    frameCache[win:id()] = f  -- cache previous window position
    f.y = screenFrame.y
    win:setFrame(f)
end

function winmod.currentWindowToBottom()
    local win = hs.window.focusedWindow()
    local f = win:frame()
    local screen = win:screen()
    local screenFrame = screen:frame()

    frameCache[win:id()] = f  -- cache previous window position
    f.y = ((screenFrame.y + screenFrame.h) - f.h)
    win:setFrame(f)
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

-- Push the window into the exact center of the screen
function winmod.center()
    local win = hs.window.focusedWindow()
    local f = win:frame()
    local curScreen = win:screen()

    frameCache[win:id()] = f -- cache previous window position
    win:centerOnScreen(curScreen)
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

return winmod
