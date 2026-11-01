-- Symlinked from the rex-navigator.nvim lazy checkout. Guarded because a Lua
-- error here would stop Rex from loading the rest of this file.
local ok, navigator = pcall(require, "rex-navigator")
if ok then
  navigator.setup()
else
  rex.log("warn", "rex-navigator not loaded: " .. tostring(navigator))
end

rex.bind("cmd+z", "pane.zoom")
rex.bind("cmd+shift+t", "client.tab.rename")
rex.bind("cmd+shift+w", "session.rename")

rex.mode("resize", { exclusive = true })
rex.bind("cmd+r", "client.mode.enter", { name = "resize" })
rex.bind("resize/h", "pane.resize", { direction = "left" })
rex.bind("resize/j", "pane.resize", { direction = "down" })
rex.bind("resize/k", "pane.resize", { direction = "up" })
rex.bind("resize/l", "pane.resize", { direction = "right" })
rex.bind("resize/enter", "client.mode.exit")

-- Runs command in a focused floating pane that closes when the command exits.
local function float(bounds, command)
  local _, err = rex.session.new_layer{
    bounds = bounds,
    focus  = true,
    layout = rex.layout.block{
      flavor  = "com.superlogical.terminal.shell",
      options = { command = command },
    },
  }
  if err ~= nil then error(err, 0) end
end

rex.action{
  name  = "btop_float",
  title = "Show btop",
  run   = function()
    -- Blocks don't get a login shell's PATH, so Homebrew's btop is missing.
    float({ 0.05, 0.05, 0.9, 0.9 },
      { "/bin/sh", "-c", "PATH=/opt/homebrew/bin:$PATH exec btop" })
  end,
}
rex.bind("ctrl+cmd+b", "btop_float")
