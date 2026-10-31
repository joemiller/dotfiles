-- Symlinked from the rex-navigator.nvim lazy checkout. Guarded because a Lua
-- error here would stop Rex from loading the rest of this file.
local ok, navigator = pcall(require, "rex-navigator")
if ok then
  navigator.setup()
else
  rex.log("warn", "rex-navigator not loaded: " .. tostring(navigator))
end

rex.bind("cmd+z", "pane.zoom")

rex.mode("resize", { exclusive = true })
rex.bind("cmd+r", "client.mode.enter", { name = "resize" })
rex.bind("resize/h", "pane.resize", { direction = "left" })
rex.bind("resize/j", "pane.resize", { direction = "down" })
rex.bind("resize/k", "pane.resize", { direction = "up" })
rex.bind("resize/l", "pane.resize", { direction = "right" })
rex.bind("resize/enter", "client.mode.exit")
