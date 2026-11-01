local function run(args)
  local argv = {os.getenv("HOME") .. "/.bin/rextore"}
  for _, arg in ipairs(args) do table.insert(argv, arg) end
  local result, err = rex.exec(argv, {timeout = 25})
  if result == nil then error(err, 0) end
  if not result.ok then
    error(result.stderr ~= "" and result.stderr or result.stdout, 0)
  end
  return {output = result.stdout}
end

rex.action{
  name = "rextore_restore_block",
  title = "Restore Saved Agent in This Block",
  category = "Agent Restore",
  run = function(ctx)
    if not ctx.block_id then error("No block is selected", 0) end
    local args = {"restore", "--block", ctx.block_id}
    if ctx.session_id then
      table.insert(args, "--session")
      table.insert(args, ctx.session_id)
    end
    return run(args)
  end,
}

rex.action{
  name = "rextore_restore_all",
  title = "Restore All Saved Agents",
  category = "Agent Restore",
  run = function()
    return run({"restore-all"})
  end,
}

rex.action{
  name = "rextore_restore_session",
  title = "Restore All Saved Agents in This Session",
  category = "Agent Restore",
  run = function(ctx)
    if not ctx.session_id then error("No session is selected", 0) end
    return run({"restore-all", "--session", ctx.session_id})
  end,
}
