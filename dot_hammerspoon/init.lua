-- include our modules
require "app_watcher"
require "app_jump_menu"
local winmod = require "window_controls"
local utils = require "utils"
-- require "volumes"

local direction   = winmod.direction

-- settings
hs.window.animationDuration = 0

-- anycomplete from: https://github.com/nathancahill/anycomplete
-- require "anycomplete"

-- load: .hammerspoon/Spoon/SpoonInstall
hs.loadSpoon("SpoonInstall")
spoon.SpoonInstall.use_syncinstall = true

Install = spoon.SpoonInstall

Install:andUse(
    "ReloadConfiguration",
    {
        start = true
    }
)

Install:andUse(
    "TimeMachineProgress",
    {
        start = false
    }
)

Install:andUse(
    "HeadphoneAutoPause",
    {
        start = true,
        config = {
            autoResume = false
        }
    }
)

Install:andUse(
    "WifiNotifier",
    {
        start = true
    }
)

-- https://www.hammerspoon.org/Spoons/WindowHalfsAndThirds.html
Install:andUse(
    "WindowHalfsAndThirds"
    -- {
    --     start = true
    -- }
)

-- examples: https://zzamboni.org/post/my-hammerspoon-configuration-with-commentary/
-- Install:andUse(
--     "WiFiTransitions",
--     {
--         config = {
--             actions = {
--                 -- { -- Test action just to see the SSID transitions
--                 --      fn = function(_, _, prev_ssid, new_ssid)
--                 --         hs.notify.show("SSID change", string.format("From '%s' to '%s'", prev_ssid, new_ssid), "")
--                 --      end
--                 -- },
--                 {
--                     fn = function(_, _, prev_ssid, new_ssid)
--                         utils.reconnectWireGuardVPN("lan")
--                     end
--                 }
--             }
--         },
--         start = true,
--         loglevel = "debug"
--     }
-- )

-- Install.repos["TaskHammer"] = {
--     desc = "TaskHammer.spoon repository",
--     url = "https://github.com/joemiller/TaskHammer"
-- }

Install.repos["MenuHammer"] = {
    url = "https://github.com/FryJay/MenuHammer"
}
Install:andUse( "MenuHammer")


-- Install:andUse(
--     "TaskHammer",
--     {
--         repo = "TaskHammer",
--         -- loglevel = "debug",
--         start = true,
--         config = {
--             tasks = {
--                 -- {
--                 --     name = "test task",
--                 --     cmd = "/usr/bin/env",
--                 --     env = {
--                 --         FOO = "bar",
--                 --         BAZ = "blah"
--                 --     }
--                 -- },
--                 -- {
--                 --     name = "fake backup",
--                 --     cmd = "/Users/joe/fake-backup.sh",
--                 --     args = {"foo", "bar"}
--                 -- },
--                 -- {
--                 --     namer = "missing name",
--                 --     cmd = "/Users/joe/fake-backup.sh",
--                 --     args = {"foo", "bar"}
--                 -- },
--                 -- {
--                 --     name = "test prompt",
--                 --     cmd = "/usr/bin/env",
--                 --     prompts = {
--                 --         {
--                 --             envvar = "PASS",
--                 --             description = "1password pass"
--                 --         },
--                 --         {
--                 --             envvar = "ANOTHER_ONE",
--                 --             description = "another input"
--                 --         }
--                 --     }
--                 -- },
--                 {
--                     name = "Restic Backup",
--                     cmd = "/Users/joe/backup-scripts/backup.sh",
--                     env = {
--                         SSH_AUTH_SOCK = "/Users/joe/.gnupg/S.gpg-agent.ssh"
--                     },
--                     prompts = {
--                         {
--                             envvar = "RESTIC_PASSWORD",
--                             description = "Please enter the Restic repository password"
--                         }
--                     }
--                 },
--                 {
--                     name = "1Password Backup",
--                     cmd = "/Users/joe/backup-scripts/1password-scripts/1p-backup-to-pass.sh",
--                     prompts = {
--                         {
--                             envvar = "PASS",
--                             description = "1password pass"
--                         }
--                     }
--                 }
--             }
--         }
--     }
-- )

Install:andUse(
    "Emojis",
    {
        hotkeys = {
            toggle = {{"ctrl", "alt", "cmd"}, "i"}
        }
    }
)

Install:andUse(
    "i3-resize",
    {
        -- start = true,
        -- loglevel = "debug",
        hotkeys = {
            toggle = {{"alt", "shift"}, "r"}
        }
    }
)

-- Install:andUse(
--     "PushToTalk",
--     {
--         start = true,
--         config = {
--             app_switcher = { ['zoom.us'] = 'push-to-talk' }
--         }
--     }
-- )

-- Install:andUse("MiroWindowsManager",
--     {
--         hotkeys = {
--             up = {{"ctrl", "alt", "cmd"}, "up"},
--             right = {{"ctrl", "alt", "cmd"}, "right"},
--             down = {{"ctrl", "alt", "cmd"}, "down"},
--             left = {{"ctrl", "alt", "cmd"}, "left"},
--             fullscreen = {{"ctrl", "alt", "cmd"}, "f"}
--         }
--     }
-- )

-- NOTE: I stopped development on MicrophoneMuter when I discovered the Mutify Mute Me app
-- Install:andUse("MicrophoneMuter",
--     {
--         start = true,
--         loglevel = "debug",
--         config = {
--             refresh_interval = 10,
--         },
--         hotkeys = {
--             toggle = { {"ctrl", "alt", "cmd"}, "m" }
--         }
--     }
-- )

-- global key binds
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "H", winmod.currentWindowToSizeOfLaptopScreen)
hs.hotkey.bind({"ctrl", "alt"}, "N", winmod.currentWindowToNextScreen)
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "N", winmod.currentAppAllWindowsToNextScreen)
-- hs.hotkey.bind({"alt", "shift"}, "h", function() winmod.resize(direction.left, 0.06) end)
-- hs.hotkey.bind({"alt", "shift"}, "j", function() winmod.resize(direction.down, 0.06) end)
-- hs.hotkey.bind({"alt", "shift"}, "k", function() winmod.resize(direction.up, 0.06) end)
-- hs.hotkey.bind({"alt", "shift"}, "l", function() winmod.resize(direction.right, 0.06) end)
-- hs.hotkey.bind({"ctrl", "shift"}, "h", function() winmod.move(direction.left, 0.1) end)
-- hs.hotkey.bind({"ctrl", "shift"}, "j", function() winmod.move(direction.down, 0.15) end)
-- hs.hotkey.bind({"ctrl", "shift"}, "k", function() winmod.move(direction.up, 0.15) end)
-- hs.hotkey.bind({"ctrl", "shift"}, "l", function() winmod.move(direction.right, 0.1) end)

-- hs.hotkey.bind({"ctrl", "shift"}, "h", function() hs.window.focusedWindow().focusWindowWest(hs.window.filter.defaultCurrentSpace()) end)
-- hs.hotkey.bind({"ctrl", "shift"}, "h", function() winmod.focusWindowWest() end)
-- hs.hotkey.bind({"ctrl", "shift"}, "j", function() hs.window.focusedWindow().focusWindowSouth(hs.window.filter.defaultCurrentSpace()) end)
-- hs.hotkey.bind({"ctrl", "shift"}, "k", function() hs.window.focusedWindow().focusWindowNorth(hs.window.filter.defaultCurrentSpace()) end)
-- hs.hotkey.bind({"ctrl", "shift"}, "l", function() hs.window.focusedWindow().focusWindowEast(hs.window.filter.defaultCurrentSpace()) end)

spoon.WindowHalfsAndThirds:bindHotkeys(
{
    left_half   = { {"ctrl", "alt", "cmd"}, "Left" },
    right_half  = { {"ctrl", "alt", "cmd"}, "Right" },
    top_half    = { {"ctrl", "alt", "cmd"}, "Up" },
    bottom_half = { {"ctrl", "alt", "cmd"}, "Down" },
    third_left  = { {"ctrl", "alt", "cmd"}, "J" },
    third_right = { {"ctrl", "alt", "cmd"}, "L" },
    -- third_up    = { {"ctrl", "alt"       }, "Up" },
    -- third_down  = { {"ctrl", "alt"       }, "Down" },
    -- top_left    = { {"ctrl",        "cmd"}, "1" },
    -- top_right   = { {"ctrl",        "cmd"}, "2" },
    -- bottom_left = { {"ctrl",        "cmd"}, "3" },
    -- bottom_right= { {"ctrl",        "cmd"}, "4" },
    max_toggle  = { {"ctrl", "alt", "cmd"}, "F" },
    undo        = { {"ctrl", "alt", "cmd"}, "Z" },
    center      = { {"ctrl", "alt", "cmd"}, "C" },
    -- larger      = { {        "alt", "cmd", "shift"}, "Right" },
    -- smaller     = { {        "alt", "cmd", "shift"}, "Left" },
    larger      = { {"ctrl", "alt", "cmd"}, "=" },  -- + / =
    smaller     = { {"ctrl", "alt", "cmd"}, "-" },
 }
)

-- @TODO: move the top level modal keybind from app_jump_menu into here somehow

-- set to 'debug' for debug output in the console
-- hs.logger.setGlobalLogLevel('debug')

config = {
  apps = {
    terms    = { 'kitty'                   },
    browsers = { 'Google Chrome', 'Safari' }
  },

  wm = {
    filters = {
      { app = 'Finder', tile = false }, -- don't tile Finder
      { app = 'Hammerspoon', title = 'Hammerspoon Console', tile = true } -- force tile Hammerspoon Console
    },

     moveKeys = {
       { key = 'h', dir = "west"  },
       { key = 'j', dir = "south" },
       { key = 'k', dir = "north" },
       { key = 'l', dir = "east"  },
     },

    defaultDisplayLayouts = {
      ['Built-in Retina Display']    = 'side-by-side',
      ['DELL U3818DW']               = 'main-center' -- TODO
    },

    -- displayLayouts = {
    --   ['Built-in Retina Display']    = { 'main-center', 'monocle', 'main-right', 'side-by-side'     },
    --   ['DELL U3818DW'] = { 'main-center', 'main-right', 'side-by-side' } -- TODO
    -- }
  },

  window = {
    highlightBorder = false,
    highlightMouse  = true,
    historyLimit    = 0
  },
}

-- wm = require('utils.wm')
-- wm.start()
-- require('tiling').start()

-- ready!
hs.notify.new({title = "Hammerspoon", subTitle = "Configuration loaded successfully"}):send()
