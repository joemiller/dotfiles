vim.opt.termguicolors = true
vim.opt.tabstop = 4
vim.opt.shiftwidth = 4
vim.opt.expandtab = true
vim.opt.mouse = "a"
vim.opt.scrolloff = 6
vim.opt.laststatus = 2
vim.opt.number = true
vim.opt.backup = false
vim.opt.writebackup = false
vim.opt.swapfile = false
vim.opt.autoread = true
vim.opt.timeoutlen = 1000
vim.opt.ttimeoutlen = 0
vim.opt.spelllang = "en_us"
vim.opt.spell = false
vim.opt.background = "dark"
vim.opt.signcolumn = "yes"
vim.opt.pumborder = "rounded"

if vim.fn.executable("rg") == 1 then
  vim.opt.grepprg = "rg --vimgrep"
end

vim.cmd([[
ab teh the
ab fro for
ab nad and
ab adn and
ab recipie recipe
ab tempalte template
ab seperate separate
ab srting string
ab balacner balancer
ab panthoen pantheon
]])
