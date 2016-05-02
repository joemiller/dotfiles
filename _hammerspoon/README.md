hammerspoon
===========

http://www.hammerspoon.org/

```
What is Hammerspoon?

This is a tool for powerful automation of OS X. At its core, Hammerspoon is
just a bridge between the operating system and a Lua scripting engine. What
gives Hammerspoon its power is a set of extensions that expose specific pieces
of system functionality, to the user.
```

Features of my hammerspoon config
---------------------------------

### hot key modal menu

Most hammerspoon config examples on the internet will map complex key configs
to something like `cmd-ctrl-alt-shift KEY`, but I can't figure out how to mash
this many keys easily and without giving myself some kind of RSI. Also, you
have to be careful to avoid overwriting hot key combos from other apps.

Instead, I use hammerspoon's modal menus. My hot keys are almost all accessible
from a modal menu that is brought up with `cmd-shift j` from there, a single
key maps to a specific function, eg: `i` will jump to or open iTerm, `c` will
jump to or open Chrome. See the `app_jump_menu.lua` for details.

![hot key modal menu screenshot](https://raw.githubusercontent.com/joemiller/dotfiles/master/_hammerspoon/hammerspoon-modal-menu-example.png)

### wifi watcher

- When joining a "foreign" network (ie: not home network) auto mute sound output
- When joining specific networks, auto-connect a Tunnelblick VPN (OpenVPN). This
  is nice for auto-joining a VPN when connecting to public (coffeeshop!) networks.

References / Resources
----------------------

- Hammerspoon Getting Started: http://www.hammerspoon.org/go/
- Hammerspoon API Docs: http://www.hammerspoon.org/docs/index.html
- Sample confiurations: https://github.com/Hammerspoon/hammerspoon/wiki/Sample-Configurations
- Random blog with examples: http://bezhermoso.github.io/2016/01/20/making-perfect-ramen-lua-os-x-automation-with-hammerspoon/
- Another random blog: https://tomdebruijn.com/posts/super-fast-application-switching/
- https://github.com/tombruijn/dotfiles/tree/master/hammerspoon
- https://github.com/cmsj/hammerspoon-config/blob/master/init.lua
- Some applescript examples: https://github.com/Hammerspoon/hammerspoon/wiki/Krillere's-init.lua-(Window-resizing-and-Safari-tab-hotkeys)

Author
------

Joe Miller (https://github.com/joemiller)
