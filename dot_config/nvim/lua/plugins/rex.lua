return {
  'wassimk/rex-navigator.nvim',
  version = '*',
  cond = vim.env.REX_SESSION ~= nil,
  config = true,
}
