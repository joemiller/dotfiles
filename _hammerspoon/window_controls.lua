local winmod = {}

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

function winmod.currentWindowToLeftHalf()
	local win = hs.window.focusedWindow()
	local f = win:frame()
	local screen = win:screen()
	local max = screen:frame()

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

  f.x = max.x + (max.w / 2)
  f.y = max.y
  f.w = max.w / 2
  f.h = max.h
  win:setFrame(f)
end

function winmod.currentWindowToSpecificSize()
  local win = hs.window.focusedWindow()
  local f = win:frame()
  local screen = win:screen():frame()
  local builtInScreen = hs.screen('Color LCD')
  local max = builtInScreen:frame()

  f.x = screen.x
  f.y = screen.y
  f.w = max.w
  f.h = max.h
  win:setFrame(f)
end

function winmod.currentWindowToNextScreen()
    local win = hs.window.focusedWindow()
    local curScreen = win:screen()
    win:moveToScreen(curScreen:next(), true, true)
end

return winmod
