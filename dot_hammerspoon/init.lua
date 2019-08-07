-- include our modules
require "app_watcher"
require "app_jump_menu"
local winmod = require "window_controls"
local utils = require "utils"

-- load .hammerspoon/Spoon/SpoonInstall
hs.loadSpoon("SpoonInstall")
spoon.SpoonInstall.use_syncinstall = true

-- anycomplete from: https://github.com/nathancahill/anycomplete
-- require "anycomplete"

-- settings
hs.window.animationDuration = 0

-- Spoons. Installed and started using the SpoonInstall spoon.
Install=spoon.SpoonInstall

Install:andUse("ReloadConfiguration",
               {
                 start = true
               }
)

Install:andUse("TimeMachineProgress",
               {
                 start = true
               }
)

Install:andUse("HeadphoneAutoPause",
               {
                 start = true,
                 autoResume = false
               }
)

Install:andUse("WifiNotifier",
               {
                 start = true
               }
)

-- Install:andUse("MicrophoneMuter",
--                {
--                  start = true,
--                  loglevel = "debug",
--                  config = {
--                      refresh_interval = 10,
--                  },
--                  hotkeys = {
--                      toggle = { {"ctrl", "alt", "cmd"}, "b" }
--                  }
--                }
-- )

-- global key binds
hs.hotkey.bind({"ctrl", "alt",      }, "F",     winmod.toggleMaximized)
hs.hotkey.bind({"ctrl", "alt",      }, "P",     winmod.windowPreviousPosition)
hs.hotkey.bind({"ctrl", "alt",      }, "H",     winmod.currentWindowToSizeOfLaptopScreen)
hs.hotkey.bind({"ctrl", "alt",      }, "C",     winmod.center)
hs.hotkey.bind({"ctrl", "alt",      }, "Left",  winmod.currentWindowToLeft)
hs.hotkey.bind({"ctrl", "alt",      }, "Right", winmod.currentWindowToRight)
hs.hotkey.bind({"ctrl", "alt",      }, "Up",    winmod.currentWindowToTop)
hs.hotkey.bind({"ctrl", "alt",      }, "Down",  winmod.currentWindowToBottom)
hs.hotkey.bind({"ctrl", "alt",      }, "N",     winmod.currentWindowToNextScreen)
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "N",     winmod.currentAppAllWindowsToNextScreen)
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "Left",  winmod.currentWindowToLeftHalf)
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "Right", winmod.currentWindowToRightHalf)

-- @TODO: move the top level modal keybind from app_jump_menu into here somehow

-- set to 'debug' for debug output in the console
-- hs.logger.setGlobalLogLevel('debug')

-- ready!
hs.notify.new( {title='Hammerspoon', subTitle='Configuration loaded successfully'} ):send()
