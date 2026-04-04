return {
  {
    "neovim/nvim-lspconfig",
    dependencies = { "saghen/blink.cmp" },
    config = function()
      vim.lsp.config("*", {
        capabilities = require("blink.cmp").get_lsp_capabilities(),
      })
      vim.lsp.enable({ "gopls", "pyright", "terraformls" })
    end,
  },

  {
    "stevearc/conform.nvim",
    event = "BufWritePre",
    config = function()
      local conform = require("conform")

      conform.setup({
        formatters_by_ft = {
          lua = { "stylua" },
          python = { "isort", "black" },
          rust = { "rustfmt", lsp_format = "fallback" },
          javascript = { "prettierd", "prettier", stop_after_first = true },
          terraform = { "terraform_fmt" },
          hcl = { "terragrunt_hclfmt" },
          go = { "gofumpt" },
        },
      })

      conform.formatters.terragrunt_hclfmt = {
        args = { "hcl", "format", "--stdin" },
        stdin = true,
        condition = false,
      }

      vim.api.nvim_create_autocmd("BufWritePre", {
        pattern = "*",
        callback = function(args)
          conform.format({ bufnr = args.buf })
        end,
      })
    end,
  },

  {
    "folke/trouble.nvim",
    dependencies = { "nvim-web-devicons" },
    opts = {},
    keys = {
      { "<Leader>xx", "<cmd>Trouble diagnostics toggle<CR>", desc = "Diagnostics" },
      { "<Leader>l", "<cmd>Trouble loclist toggle<CR>", desc = "Location List" },
      { "<Leader>cq", "<cmd>Trouble qflist toggle<CR>", desc = "Quickfix" },
      { "<Leader>xr", "<cmd>Trouble lsp_references toggle<CR>", desc = "LSP References" },
    },
  },
}
