return {
  {
    "ray-x/go.nvim",
    dependencies = {
      "ray-x/guihua.lua",
      "neovim/nvim-lspconfig",
      "nvim-treesitter/nvim-treesitter",
    },
    ft = { "go", "gomod", "gowork", "gotmpl" },
    build = ':lua require("go.install").update_all_sync()',
    config = function()
      require("go").setup({
        lsp_cfg = false,
        lsp_gofumpt = false,
        lsp_inlay_hints = { enable = false },
      })

      local map = vim.keymap.set
      vim.api.nvim_create_autocmd("FileType", {
        pattern = { "go", "gomod", "gowork", "gotmpl" },
        group = vim.api.nvim_create_augroup("GoKeymaps", {}),
        callback = function(ev)
          local opts = { buffer = ev.buf }
          map("n", "<Leader>r", "<cmd>GoRun<CR>", opts)
          map("n", "<Leader>b", "<cmd>GoBuild<CR>", opts)
          map("n", "<Leader>t", "<cmd>GoTest<CR>", opts)
          map("n", "<Leader>tf", "<cmd>GoTestFunc<CR>", opts)
          map("n", "<Leader>c", "<cmd>GoCoverage<CR>", opts)
          map("n", "<Leader>s", "<cmd>GoImplements<CR>", opts)
          map("n", "<Leader>e", vim.lsp.buf.rename, opts)

          -- Definition in splits (via LSP)
          map("n", "<Leader>ds", function() vim.cmd("split") vim.lsp.buf.definition() end, opts)
          map("n", "<Leader>dv", function() vim.cmd("vsplit") vim.lsp.buf.definition() end, opts)
          map("n", "<Leader>dt", function() vim.cmd("tab split") vim.lsp.buf.definition() end, opts)

          -- go.nvim extras
          map("n", "<Leader>ge", "<cmd>GoIfErr<CR>", opts)
          map("n", "<Leader>ga", "<cmd>GoAlt<CR>", opts)
          map("n", "<Leader>gfs", "<cmd>GoFillStruct<CR>", opts)
          map("n", "<Leader>gat", "<cmd>GoAddTag<CR>", opts)
        end,
      })
    end,
  },

  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
      require("nvim-treesitter").setup({
        ensure_installed = {
          "go", "python", "lua", "hcl", "terraform",
          "yaml", "json", "markdown", "bash", "dockerfile",
          "ruby", "vim", "vimdoc",
        },
      })
    end,
  },

  {
    "hashivim/vim-terraform",
    ft = { "terraform", "tf", "tfvars" },
    config = function()
      vim.g.terraform_align = 1
      vim.g.terraform_fmt_on_save = 0
    end,
  },

  { "juliosueiras/vim-terraform-completion", ft = { "terraform", "tf", "tfvars" } },
  { "jjo/vim-cue", ft = "cue" },
  { "b4b4r07/vim-hcl", ft = "hcl" },
}
