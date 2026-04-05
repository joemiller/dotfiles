return {
  { "awalland/nvim-file-watch", opts = {} },
  { "windwp/nvim-autopairs", event = "InsertEnter", opts = {} },
  { "tpope/vim-commentary" },
  { "tpope/vim-surround" },
  { "tpope/vim-repeat" },
  { "junegunn/vim-easy-align" },
  { "christoomey/vim-tmux-navigator" },

  {
    "ibhagwan/fzf-lua",
    dependencies = { "nvim-web-devicons" },
    opts = function()
      local actions = require("fzf-lua.actions")
      return {
        actions = {
          files = {
            ["enter"]  = actions.file_edit_or_qf,
            ["ctrl-s"] = { fn = actions.file_split, header = "horizontal split" },
            ["ctrl-x"] = { fn = actions.file_vsplit, header = "vertical split" },
            ["ctrl-t"] = { fn = actions.file_tabedit, header = "new tab" },
          },
        },
      }
    end,
    keys = {
      { "<Leader>o", "<cmd>FzfLua files<CR>", desc = "Find Files" },
      { "<Leader>ff", "<cmd>FzfLua files<CR>", desc = "Find Files" },
      { "<Leader>fg", "<cmd>FzfLua live_grep<CR>", desc = "Live Grep" },
      { "<Leader>fb", "<cmd>FzfLua buffers<CR>", desc = "Buffers" },
      { "<Leader>fz", "<cmd>FzfLua spell_suggest<CR>", desc = "Spell Suggest" },
      { "<Leader>fh", "<cmd>FzfLua help_tags<CR>", desc = "Help Tags" },
      { "<Leader>fr", "<cmd>FzfLua oldfiles<CR>", desc = "Recent Files" },
      { "<Leader>fs", "<cmd>FzfLua lsp_document_symbols<CR>", desc = "Document Symbols" },
    },
  },
}
