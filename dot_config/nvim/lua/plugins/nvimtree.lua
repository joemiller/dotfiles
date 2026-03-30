return {
  {
    "nvim-tree/nvim-tree.lua",
    lazy = false,
    dependencies = { "nvim-web-devicons" },
    config = function()
      local function on_attach(bufnr)
        local api = require("nvim-tree.api")
        local function opts(desc)
          return { desc = "nvim-tree: " .. desc, buffer = bufnr, noremap = true, silent = true, nowait = true }
        end

        api.config.mappings.default_on_attach(bufnr)

        vim.keymap.set("n", "<CR>", api.node.open.edit, opts("Open"))
        vim.keymap.set("n", "o", api.node.open.edit, opts("Open"))
        vim.keymap.set("n", "<2-LeftMouse>", api.node.open.edit, opts("Open"))
        vim.keymap.set("n", "<2-RightMouse>", api.tree.change_root_to_node, opts("CD"))
        vim.keymap.set("n", "<C-]>", api.tree.change_root_to_node, opts("CD"))
        vim.keymap.set("n", "s", api.node.open.vertical, opts("Open: Vertical Split"))
        vim.keymap.set("n", "i", api.node.open.horizontal, opts("Open: Horizontal Split"))
        vim.keymap.set("n", "t", api.node.open.tab, opts("Open: New Tab"))
        vim.keymap.set("n", "<", api.node.navigate.sibling.prev, opts("Previous Sibling"))
        vim.keymap.set("n", ">", api.node.navigate.sibling.next, opts("Next Sibling"))
        vim.keymap.set("n", "P", api.node.navigate.parent, opts("Parent Directory"))
        vim.keymap.set("n", "<BS>", api.node.navigate.parent_close, opts("Close Directory"))
        vim.keymap.set("n", "<S-CR>", api.node.navigate.parent_close, opts("Close Directory"))
        vim.keymap.set("n", "<Tab>", api.node.open.preview, opts("Open Preview"))
        vim.keymap.set("n", "K", api.node.navigate.sibling.first, opts("First Sibling"))
        vim.keymap.set("n", "J", api.node.navigate.sibling.last, opts("Last Sibling"))
        vim.keymap.set("n", "H", api.tree.toggle_hidden_filter, opts("Toggle Dotfiles"))
        vim.keymap.set("n", "R", api.tree.reload, opts("Refresh"))
        vim.keymap.set("n", "a", api.fs.create, opts("Create"))
        vim.keymap.set("n", "d", api.fs.remove, opts("Delete"))
        vim.keymap.set("n", "r", api.fs.rename, opts("Rename"))
        vim.keymap.set("n", "<C-r>", api.fs.rename_sub, opts("Rename: Omit Filename"))
        vim.keymap.set("n", "x", api.fs.cut, opts("Cut"))
        vim.keymap.set("n", "c", api.fs.copy.node, opts("Copy"))
        vim.keymap.set("n", "p", api.fs.paste, opts("Paste"))
        vim.keymap.set("n", "y", api.fs.copy.filename, opts("Copy Name"))
        vim.keymap.set("n", "Y", api.fs.copy.relative_path, opts("Copy Relative Path"))
        vim.keymap.set("n", "gy", api.fs.copy.absolute_path, opts("Copy Absolute Path"))
        vim.keymap.set("n", "[c", api.node.navigate.git.prev, opts("Prev Git"))
        vim.keymap.set("n", "]c", api.node.navigate.git.next, opts("Next Git"))
        vim.keymap.set("n", "-", api.tree.change_root_to_parent, opts("Up"))
        vim.keymap.set("n", "S", api.node.run.system, opts("Run System"))
        vim.keymap.set("n", "q", api.tree.close, opts("Close"))
        vim.keymap.set("n", "g?", api.tree.toggle_help, opts("Help"))
      end

      require("nvim-tree").setup({
        disable_netrw = true,
        hijack_netrw = true,
        hijack_cursor = false,
        sync_root_with_cwd = false,
        hijack_directories = {
          enable = true,
          auto_open = true,
        },
        diagnostics = {
          enable = false,
        },
        git = {
          timeout = 1000,
          ignore = false,
        },
        update_focused_file = {
          enable = false,
          update_root = false,
          ignore_list = {},
        },
        filters = {
          dotfiles = false,
        },
        view = {
          width = 25,
          side = "left",
        },
        tab = {
          sync = {
            open = true,
            close = true,
          },
        },
        on_attach = on_attach,
      })
    end,
  },
}
