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

-- Actions run on this server even in a remote host's session, so the tab list
-- comes from ctx.server.
-- Returns fzf input, one tab per line as "<display>\t<session ID>\t<window ID>",
-- with the display padded so the session and tab columns line up.
local function tab_lines(api)
  local list, err = api.call("session.attach_all", { event_scope = "session" })
  if list == nil then error(err, 0) end
  local rows, width = {}, #"SESSION"
  for _, s in ipairs(list.sessions) do
    local view, verr = api.session.view{ session_id = s.session_id }
    if view == nil then error(verr, 0) end
    width = math.max(width, #s.label)
    for _, w in ipairs(view.windows) do
      local name = w.label
      -- Unrenamed tabs keep the default "Window <id>" label; show the focused pane's title instead.
      if name:match("^Window %x+$") and w.focused_block_id then
        local t = api.block.call("com.superlogical.terminal", "title",
          { session_id = s.session_id, block_id = w.focused_block_id })
        if t and t.title ~= "" then name = t.title end
      end
      rows[#rows + 1] = { s.label, name, s.session_id, w.window_id }
    end
  end
  local fmt = "%-" .. width .. "s   %s"
  local lines = {}
  for _, r in ipairs(rows) do
    lines[#lines + 1] = fmt:format(r[1], r[2]) .. "\t" .. r[3] .. "\t" .. r[4]
  end
  return table.concat(lines, "\n"), fmt:format("SESSION", "TAB")
end

local pick_tab_sh = [[
PATH=/opt/homebrew/bin:$PATH
sel=$(printf '%s\n' "$1" | fzf --reverse --prompt='tab> ' --header="$2" \
  --delimiter='\t' --with-nth=1)
rc=$?
case $rc in
  0) ;;
  1|130) exit 0 ;;
  *) printf 'fzf failed (exit %s), press Enter ' "$rc"; read -r _; exit "$rc" ;;
esac
rex do session.select \
  "session_id=$(printf '%s' "$sel" | cut -f2)" \
  "window_id=$(printf '%s' "$sel" | cut -f3)" || { printf 'press Enter '; read -r _; }
]]

rex.action{
  name  = "tab_picker",
  title = "Go to Tab…",
  run   = function(ctx)
    local api = ctx.server and rex.server(ctx.server) or rex
    local lines, header = tab_lines(api)
    float({ 0.15, 0.1, 0.7, 0.6 },
      { "/bin/sh", "-c", pick_tab_sh, "sh", lines, header })
  end,
}
rex.bind("ctrl+cmd+k", "tab_picker")

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
