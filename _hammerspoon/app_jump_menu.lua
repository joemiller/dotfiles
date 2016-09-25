-- cmd-shift-j modal "menu" for hot key jumps between apps.
--
-- I do this in a modal so the list of hot keys can be long without interfering
-- with applications own hot key mappings.
--

local utils = require "utils"
local nc = require "notification_center"

modal = hs.hotkey.modal.new({"cmd","shift"},'j')

function modal:entered()
    hs.alert.show(
string.format(
"hot keys active: (exit: enter esc j) \
    v - vivaldi (browser) \
    c - chrome \
    t - chrome quick tabs \
    e - evernote \
    f - finder \
    i - iterm \
    l - slack \
    s - spotify \
    m - iMessage \
    n - Notification Center \
    . - Do not disturb (toggle) \
    / - hammerspoon console \
\
%s \
",
    utils.osxVersionString()
),
    999999
    )
end
function modal:exited() hs.alert.closeAll() end

-- close modal with any of these keys
modal:bind('','j', function() modal:exit() end)
modal:bind('','escape', function() modal:exit() end)
modal:bind('','return', function() modal:exit() end)

-- hotkeys while modal is active
modal:bind('','v', function() hs.application.launchOrFocus( "Vivaldi" )        ; modal:exit() end )
modal:bind('','c', function() hs.application.launchOrFocus( "Google Chrome" )  ; modal:exit() end )
modal:bind('','t', function() utils.chromeQuickTabs()                          ; modal:exit() end )
modal:bind('','e', function() hs.application.launchOrFocus( "Evernote.app" )   ; modal:exit() end )
modal:bind('','i', function() hs.application.launchOrFocus( "iTerm.app" )      ; modal:exit() end )
modal:bind('','f', function() hs.application.launchOrFocus( "Finder.app" )     ; modal:exit() end )
modal:bind('','s', function() hs.application.launchOrFocus( "Spotify.app" )    ; modal:exit() end )
modal:bind('','l', function() hs.application.launchOrFocus( "Slack.app" )      ; modal:exit() end )
modal:bind('','m', function() hs.application.launchOrFocus( "Messages.app" )   ; modal:exit() end )
modal:bind('','n', function() nc.showNotificationCenter()                      ; modal:exit() end )
modal:bind('','.', function() nc.toggleDoNotDisturb()                          ; modal:exit() end )
modal:bind('','/', function() hs.toggleConsole()                               ; modal:exit() end )
