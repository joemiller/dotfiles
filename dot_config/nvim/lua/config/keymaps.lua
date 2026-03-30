local map = vim.keymap.set

-- Window resizing
map("n", "+", '<cmd>exe "resize " . (winheight(0) * 3/2)<CR>', { silent = true })
map("n", "-", '<cmd>exe "resize " . (winheight(0) * 2/3)<CR>', { silent = true })

-- Q = format (replaces Ex mode)
map("", "Q", "gq")

-- Tab to cycle splits (nvim-tree's buffer-local <Tab> takes precedence in tree)
map("n", "<Tab>", "<C-w>w")

-- SPC SPC - visual line mode
map("n", "<Leader><Leader>", "V")

-- SPC [1-9] - switch to tab
for i = 1, 9 do
  map("n", "<Leader>" .. i, i .. "gt", { silent = true })
end

-- SPC w - save
map("n", "<Leader>w", "<cmd>w<CR>")
-- SPC qa - quit all
map("n", "<Leader>qa", "<cmd>qa<CR>")
-- SPC q - quit
map("n", "<Leader>q", "<cmd>q<CR>")

-- SPC fR - reload config
map("n", "<Leader>fR", "<cmd>source $MYVIMRC<CR>")

-- SPC n/p - next/prev tab
map("n", "<Leader>n", "<cmd>tabnext<CR>")
map("n", "<Leader>p", "<cmd>tabprev<CR>")

-- ALT-Tab - prev tab (normal + insert)
map("n", "<M-Tab>", "<cmd>tabprev<CR>")
map("i", "<M-Tab>", "<cmd>tabprev<CR>")

-- Diagnostics
map("n", "<Leader>d", vim.diagnostic.open_float, { silent = true })
map("n", "[d", vim.diagnostic.goto_prev, { silent = true })
map("n", "]d", vim.diagnostic.goto_next, { silent = true })

-- NvimTree toggle
map("n", "<C-n>", "<cmd>NvimTreeToggle<CR>")

-- Markdown table alignment (visual mode)
vim.api.nvim_create_autocmd("FileType", {
  pattern = "markdown",
  callback = function(ev)
    map("v", "<Leader><Bslash>", ":EasyAlign*<Bar><CR>", { buffer = ev.buf })
  end,
})
