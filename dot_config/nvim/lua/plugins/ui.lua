return {
  { "nvim-tree/nvim-web-devicons", lazy = true },

  {
    "nvim-lualine/lualine.nvim",
    dependencies = { "nvim-web-devicons" },
    opts = {
      options = {
        icons_enabled = true,
        theme = "auto",
        component_separators = { left = "", right = "" },
        section_separators = { left = "", right = "" },
        globalstatus = false,
      },
      sections = {
        lualine_a = { "mode" },
        lualine_b = { "diff", "diagnostics" },
        lualine_c = { { "filename", path = 1, shorting_target = 0 } },
        lualine_x = { "filetype" },
        lualine_y = {},
        lualine_z = { "location" },
      },
      inactive_sections = {
        lualine_a = {},
        lualine_b = {},
        lualine_c = { { "filename", path = 1, shorting_target = 0 } },
        lualine_x = { "location" },
        lualine_y = {},
        lualine_z = {},
      },
    },
  },

  {
    "akinsho/bufferline.nvim",
    dependencies = { "nvim-web-devicons" },
    opts = {
      options = {
        mode = "tabs",
        separator_style = "thin",
        offsets = {
          {
            filetype = "NvimTree",
            text = function()
              return vim.fn.getcwd()
            end,
            highlight = "Directory",
            text_align = "left",
          },
        },
      },
    },
  },

  {
    "folke/which-key.nvim",
    event = "VeryLazy",
    opts = {},
  },

  {
    "NvChad/nvim-colorizer.lua",
    event = "BufReadPost",
    opts = {},
  },

  {
    "ntpeters/vim-better-whitespace",
    config = function()
      vim.g.better_whitespace_filetypes_blacklist = { "diff", "gitcommit", "unite", "qf", "help" }
    end,
  },
}
