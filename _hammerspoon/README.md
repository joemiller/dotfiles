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
- When joining specific networks, auto-connect a Tunnelblick VPN (OpenVPN).

Author
------

Joe Miller (https://github.com/joemiller)
