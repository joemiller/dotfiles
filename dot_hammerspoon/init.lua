-- include our modules
require "app_watcher"
require "app_jump_menu"
local winmod = require "window_controls"
local utils = require "utils"
-- require "volumes"

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
        start = true
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

-- examples: https://zzamboni.org/post/my-hammerspoon-configuration-with-commentary/
Install:andUse(
    "WiFiTransitions",
    {
        config = {
            actions = {
                -- { -- Test action just to see the SSID transitions
                --      fn = function(_, _, prev_ssid, new_ssid)
                --         hs.notify.show("SSID change", string.format("From '%s' to '%s'", prev_ssid, new_ssid), "")
                --      end
                -- },
                {
                    fn = function(_, _, prev_ssid, new_ssid)
                        utils.reconnectWireGuardVPN("lan")
                    end
                }
            }
        },
        start = true,
        loglevel = "debug"
    }
)

Install.repos["TaskHammer"] = {
    desc = "TaskHammer.spoon repository",
    url = "https://github.com/joemiller/TaskHammer"
}

Install:andUse(
    "TaskHammer",
    {
        repo = "TaskHammer",
        -- loglevel = "debug",
        start = true,
        config = {
            tasks = {
                -- {
                --     name = "test task",
                --     cmd = "/usr/bin/env",
                --     env = {
                --         FOO = "bar",
                --         BAZ = "blah"
                --     }
                -- },
                -- {
                --     name = "fake backup",
                --     cmd = "/Users/joe/fake-backup.sh",
                --     args = {"foo", "bar"}
                -- },
                -- {
                --     namer = "missing name",
                --     cmd = "/Users/joe/fake-backup.sh",
                --     args = {"foo", "bar"}
                -- },
                -- {
                --     name = "test prompt",
                --     cmd = "/usr/bin/env",
                --     prompts = {
                --         {
                --             envvar = "PASS",
                --             description = "1password pass"
                --         },
                --         {
                --             envvar = "ANOTHER_ONE",
                --             description = "another input"
                --         }
                --     }
                -- },
                {
                    name = "Restic Backup",
                    cmd = "/Users/joe/backup-scripts/backup.sh",
                    env = {
                        SSH_AUTH_SOCK = "/Users/joe/.gnupg/S.gpg-agent.ssh"
                    },
                    prompts = {
                        {
                            envvar = "RESTIC_PASSWORD",
                            description = "Please enter the Restic repository password"
                        }
                    }
                },
                {
                    name = "1Password Backup",
                    cmd = "/Users/joe/backup-scripts/1password-scripts/1p-backup-to-pass.sh",
                    prompts = {
                        {
                            envvar = "PASS",
                            description = "1password pass"
                        }
                    }
                }
            }
        }
    }
)

Install:andUse(
    "Emojis",
    {
        hotkeys = {
            toggle = {{"ctrl", "alt", "cmd"}, "i"}
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
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "F", winmod.toggleMaximized)
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "P", winmod.windowPreviousPosition)
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "H", winmod.currentWindowToSizeOfLaptopScreen)
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "C", winmod.center)
hs.hotkey.bind({"ctrl", "alt"}, "Left", winmod.currentWindowToLeft)
hs.hotkey.bind({"ctrl", "alt"}, "Right", winmod.currentWindowToRight)
hs.hotkey.bind({"ctrl", "alt"}, "Up", winmod.currentWindowToTop)
hs.hotkey.bind({"ctrl", "alt"}, "Down", winmod.currentWindowToBottom)
hs.hotkey.bind({"ctrl", "alt"}, "N", winmod.currentWindowToNextScreen)
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "N", winmod.currentAppAllWindowsToNextScreen)
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "Left", winmod.currentWindowToLeftHalf)
hs.hotkey.bind({"ctrl", "alt", "cmd"}, "Right", winmod.currentWindowToRightHalf)

-- @TODO: move the top level modal keybind from app_jump_menu into here somehow

-- set to 'debug' for debug output in the console
-- hs.logger.setGlobalLogLevel('debug')

-- ready!
hs.notify.new({title = "Hammerspoon", subTitle = "Configuration loaded successfully"}):send()
