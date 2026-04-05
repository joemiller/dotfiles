local augroup = vim.api.nvim_create_augroup
local autocmd = vim.api.nvim_create_autocmd

-- Filetype-specific indentation
local ft_indent = {
  go     = { tabstop = 2, shiftwidth = 2, expandtab = false },
  python = { tabstop = 4, shiftwidth = 4, expandtab = true },
  ruby   = { tabstop = 2, shiftwidth = 2, expandtab = true },
  yaml   = { tabstop = 2, shiftwidth = 2, expandtab = true },
  sh     = { tabstop = 2, shiftwidth = 2, expandtab = true },
}

local indent_group = augroup("FileTypeIndent", {})
for ft, opts in pairs(ft_indent) do
  autocmd("FileType", {
    group = indent_group,
    pattern = ft,
    callback = function()
      for k, v in pairs(opts) do
        vim.bo[k] = v
      end
    end,
  })
end

-- Spell checking for prose
autocmd("FileType", {
  group = augroup("SpellCheck", {}),
  pattern = { "markdown", "text" },
  callback = function()
    vim.opt_local.spell = true
  end,
})

-- Restore cursor position
autocmd("BufReadPost", {
  group = augroup("RestoreCursor", {}),
  callback = function()
    local mark = vim.api.nvim_buf_get_mark(0, '"')
    if mark[1] > 0 and mark[1] <= vim.api.nvim_buf_line_count(0) then
      pcall(vim.api.nvim_win_set_cursor, 0, mark)
    end
  end,
})

-- Auto-reload files changed externally
autocmd({ "FocusGained", "BufEnter" }, {
  group = augroup("AutoRead", {}),
  callback = function()
    vim.cmd("checktime")
  end,
})

-- Color column for prose (soft limit at 80, hard wall at 120+)
autocmd("FileType", {
  group = augroup("ColorColumn", {}),
  pattern = { "markdown", "text" },
  callback = function()
    local cols = { "80" }
    for i = 120, 999 do
      cols[#cols + 1] = tostring(i)
    end
    vim.opt_local.colorcolumn = table.concat(cols, ",")
  end,
})

-- Auto-close nvim-tree when it's the last window
autocmd("BufEnter", {
  group = augroup("NvimTreeAutoClose", {}),
  nested = true,
  callback = function()
    if vim.fn.winnr("$") == 1 and vim.fn.bufname():match("^NvimTree_") then
      local win = vim.api.nvim_get_current_win()
      local tab = vim.api.nvim_get_current_tabpage()
      vim.schedule(function()
        if not vim.api.nvim_win_is_valid(win) then
          return
        end
        if vim.api.nvim_get_current_tabpage() ~= tab then
          return
        end
        if #vim.api.nvim_tabpage_list_wins(tab) == 1 then
          vim.api.nvim_win_close(win, true)
        end
      end)
    end
  end,
})
