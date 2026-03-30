return {
  {
    "saghen/blink.cmp",
    version = "1.*",
    dependencies = {
      "zbirenbaum/copilot.lua",
      "fang2hou/blink-copilot",
    },
    config = function()
      require("blink.cmp").setup({
        keymap = {
          preset = "none",
          ["<C-space>"] = { "show", "show_documentation", "hide_documentation" },
          ["<C-e>"] = { "hide", "fallback" },
          ["<CR>"] = { "accept", "fallback" },
          ["<Tab>"] = {
            "select_next",
            function()
              local ok, suggestion = pcall(require, "copilot.suggestion")
              if ok and suggestion.is_visible() then
                suggestion.accept()
                return true
              end
            end,
            "fallback",
          },
          ["<S-Tab>"] = { "select_prev", "fallback" },
          ["<C-b>"] = { "scroll_documentation_up", "fallback" },
          ["<C-f>"] = { "scroll_documentation_down", "fallback" },
        },
        appearance = {
          nerd_font_variant = "mono",
        },
        completion = {
          list = {
            selection = {
              preselect = false,
              auto_insert = false,
            },
          },
          documentation = { auto_show = true },
        },
        sources = {
          default = { "lsp", "copilot", "path", "buffer" },
          providers = {
            copilot = {
              name = "copilot",
              module = "blink-copilot",
              async = true,
              score_offset = 100,
            },
          },
        },
        cmdline = {
          keymap = { preset = "inherit" },
        },
      })

      -- Dismiss copilot ghost text when blink menu opens, restore when it closes
      vim.api.nvim_create_autocmd("User", {
        pattern = "BlinkCmpMenuOpen",
        callback = function()
          local ok, suggestion = pcall(require, "copilot.suggestion")
          if ok then
            suggestion.dismiss()
            vim.b.copilot_suggestion_hidden = true
          end
        end,
      })
      vim.api.nvim_create_autocmd("User", {
        pattern = "BlinkCmpMenuClose",
        callback = function()
          vim.b.copilot_suggestion_hidden = false
        end,
      })
    end,
  },
}
