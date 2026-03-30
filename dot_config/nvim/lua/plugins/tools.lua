return {
  {
    "zbirenbaum/copilot.lua",
    cmd = "Copilot",
    event = "InsertEnter",
    init = function()
      vim.api.nvim_create_autocmd("InsertEnter", {
        group = vim.api.nvim_create_augroup("CopilotAutoSuggest", {}),
        callback = function()
          vim.schedule(function()
            local ok, suggestion = pcall(require, "copilot.suggestion")
            if ok then suggestion.next() end
          end)
        end,
      })
    end,
    opts = {
      suggestion = {
        auto_trigger = true,
        keymap = {
          accept = false,
          next = "<M-]>",
          prev = "<M-[>",
          dismiss = "<C-]>",
        },
      },
      filetypes = {
        yaml = true,
        markdown = true,
      },
    },
  },
  { "wakatime/vim-wakatime" },

  {
    "Shatur/neovim-session-manager",
    dependencies = { "nvim-lua/plenary.nvim" },
    config = function()
      local config = require("session_manager.config")
      require("session_manager").setup({
        autoload_mode = config.AutoloadMode.CurrentDir,
        autosave_last_session = true,
        autosave_ignore_not_normal = true,
        autosave_ignore_filetypes = { "gitcommit" },
        autosave_only_in_session = false,
        max_path_length = 160,
      })

      vim.api.nvim_create_autocmd("User", {
        pattern = "SessionLoadPost",
        group = vim.api.nvim_create_augroup("SessionNvimTree", {}),
        callback = function()
          require("nvim-tree.api").tree.open()
        end,
      })
    end,
  },

  {
    "mhinz/vim-startify",
    config = function()
      vim.g.startify_session_dir = "~/.vim/sessions"
      vim.g.startify_session_autoload = 0
      vim.g.startify_session_persistence = 0
      vim.g.startify_files_number = 6
      vim.g.startify_bookmarks = {
        "~/.config/nvim/init.lua",
        "~/.zshrc",
      }
    end,
  },
}
