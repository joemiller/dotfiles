return {
  { "tpope/vim-fugitive" },

  {
    "lewis6991/gitsigns.nvim",
    opts = {
      on_attach = function(bufnr)
        local gs = require("gitsigns")
        local map = vim.keymap.set

        map("n", "]c", function()
          if vim.wo.diff then return "]c" end
          vim.schedule(function() gs.nav_hunk("next") end)
          return "<Ignore>"
        end, { buffer = bufnr, expr = true })

        map("n", "[c", function()
          if vim.wo.diff then return "[c" end
          vim.schedule(function() gs.nav_hunk("prev") end)
          return "<Ignore>"
        end, { buffer = bufnr, expr = true })

        local opts = { buffer = bufnr }
        map("n", "<Leader>hs", gs.stage_hunk, opts)
        map("n", "<Leader>hr", gs.reset_hunk, opts)
        map("v", "<Leader>hs", function() gs.stage_hunk({ vim.fn.line("."), vim.fn.line("v") }) end, opts)
        map("v", "<Leader>hr", function() gs.reset_hunk({ vim.fn.line("."), vim.fn.line("v") }) end, opts)
        map("n", "<Leader>hu", gs.undo_stage_hunk, opts)
        map("n", "<Leader>hp", gs.preview_hunk, opts)
        map("n", "<Leader>hb", function() gs.blame_line({ full = true }) end, opts)
        map("n", "<Leader>hd", gs.diffthis, opts)
      end,
    },
  },
}
