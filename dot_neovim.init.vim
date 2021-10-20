"
"  Jesse Nelson <spheromak@gmail.com>
"  joe miller <joeym@joeym.net>
"
"-------------------------------------------------------------------------------
" heavily influenced by spacemacs. leader key is space. search for 'SPC' below
" for specific hot key combos
"
" https://github.com/neovim/neovim/wiki/FAQ
"

set nocompatible               " be iMproved

set t_Co=256
if (has("nvim"))
  "For Neovim 0.1.3 and 0.1.4 < https://github.com/neovim/neovim/pull/2198 >
  let $NVIM_TUI_ENABLE_TRUE_COLOR=1
endif
"For Neovim > 0.1.5 and Vim > patch 7.4.1799 < https://github.com/vim/vim/commit/61be73bb0f965a895bfb064ea3e55476ac175162 >
"Based on Vim patch 7.4.1770 (`guicolors` option) < https://github.com/vim/vim/commit/8a633e3427b47286869aa4b96f2bfc1fe65b25cd >
" < https://github.com/neovim/neovim/wiki/Following-HEAD#20160511 >
if (has("termguicolors"))
  set termguicolors
endif

"set clipboard=unnamed          " enable clipboard sharing with mac or x11

if has('nvim')
  runtime! plugin/python_setup.vim
endif

set ts=4
set sw=4
set expandtab
autocmd FileType go set tabstop=2|set shiftwidth=2|set noexpandtab
autocmd FileType python set tabstop=4|set shiftwidth=4|set expandtab
autocmd FileType ruby set tabstop=2|set shiftwidth=2|set expandtab
autocmd FileType yaml set tabstop=2|set shiftwidth=2|set expandtab
autocmd FileType coffee set tabstop=2|set shiftwidth=2|set expandtab
autocmd FileType sh set tabstop=2|set shiftwidth=2|set expandtab

set ttyfast    " Send more characters for redraws
set mouse=a    " enable mouse
"set ttymouse=xterm2  " xterm2 to make split resizing with the mouse work. doesn't work with 'xterm' *shrug*. http://superuser.com/questions/549930/cant-resize-vim-splits-inside-tmux

" buffer pos memory
"set viminfo='10,\"100,:20,%,n~/.viminfo

nnoremap <silent> + :exe "resize " . (winheight(0) * 3/2)<CR>
nnoremap <silent> - :exe "resize " . (winheight(0) * 2/3)<CR>

function! ResCur()
  if line("'\"") <= line("$")
    normal! g`"
    return 1
  endif
endfunction

augroup resCur
  autocmd!
  autocmd BufWinEnter * call ResCur()
augroup END

" Scripts and Bundles " {{{
" Specify a directory for plugins
" - For Neovim: ~/.local/share/nvim/plugged
" - Avoid using standard Vim directory names like 'plugin'
call plug#begin('~/.local/share/nvim/plugged')

Plug 'Chiel92/vim-autoformat'
Plug 'tpope/vim-fugitive'
Plug 'oplatek/Conque-Shell'
Plug 'scrooloose/nerdtree',
Plug 'jistr/vim-nerdtree-tabs',
Plug 'Xuyuanp/nerdtree-git-plugin',
Plug 'jiangmiao/auto-pairs'
Plug 'airblade/vim-gitgutter'
Plug 'vim-airline/vim-airline'
Plug 'vim-airline/vim-airline-themes'
Plug 't9md/vim-chef'
Plug 'rodjek/vim-puppet'
"Plug 'JSON.vim'
Plug 'nsf/gocode', {'rtp': 'vim/'}
Plug 'fatih/vim-go'
Plug 'ctrlpvim/ctrlp.vim'
Plug 'altercation/vim-colors-solarized'
Plug 'majutsushi/tagbar'
Plug 'craigemery/vim-autotag'
" "Plugin 'benekastah/neomake'
"Plug 'scrooloose/syntastic'
Plug 'w0rp/ale'
Plug 'vim-scripts/vim-json-bundle'
Plug 'tpope/vim-repeat'
Plug 'christoomey/vim-tmux-navigator'
Plug 'smerrill/vcl-vim-plugin'
"Plugin 'Valloric/YouCompleteMe'             " cd ~/.vim/bundle/YouCompleteMe ; ./install.py --clang-completer --gocode-completer
Plug 'Shougo/deoplete.nvim',       { 'do': ':UpdateRemotePlugins' }
"Plug 'zchee/deoplete-go', { 'do': 'make'}
"Plug 'deoplete-plugins/deoplete-go', { 'do': 'make'}
Plug 'tbodt/deoplete-tabnine', { 'do': './install.sh' }
Plug 'ntpeters/vim-better-whitespace'
Plug 'Matt-Deacalion/vim-systemd-syntax'
Plug 'ekalinin/Dockerfile.vim'
Plug 'kchmck/vim-coffee-script'
Plug 'digitaltoad/vim-pug'                " pug, formerly Jade markup lang
Plug 'tpope/vim-commentary'
Plug 'nazo/pt.vim'
Plug 'vim-ruby/vim-ruby'
Plug 'ConradIrwin/vim-bracketed-paste'
Plug 'tpope/vim-surround'
Plug 'dgryski/vim-godef'
Plug 'mattn/webapi-vim'
Plug 'mattn/gist-vim'
Plug 'flazz/vim-colorschemes'
Plug 'godlygeek/tabular'
Plug 'gabrielelana/vim-markdown'
Plug 'junegunn/vim-easy-align'
Plug 'mkitt/tabline.vim'
Plug 'editorconfig/editorconfig-vim'
Plug 'jez/vim-github-hub'
Plug 'wakatime/vim-wakatime'
Plug 'junegunn/vim-emoji'
Plug 'rakr/vim-one'                       " another clone of atom's One theme
Plug 'liuchengxu/space-vim-dark'
Plug 'tpope/vim-endwise'
" "Plugin 'xolox/vim-session'
" Plug 'xolox/vim-misc'
Plug 'sjl/vitality.vim'                   " nice tweaks for making iterm2 + vim + tmux play together, including cursor shape toggling
Plug 'b4b4r07/vim-hcl'
Plug 'fatih/vim-hclfmt'                   " install hclfmt: go get github.com/fatih/hclfmt
Plug 'mhinz/vim-startify'
Plug 'markcornick/vim-bats'
Plug 'robbles/logstash'
Plug 'hashivim/vim-terraform'
Plug 'juliosueiras/vim-terraform-completion'
Plug 'yorinasub17/vim-terragrunt'
Plug 'liuchengxu/vim-which-key'
Plug 'ap/vim-css-color'

" Initialize plugin system
call plug#end()

let g:Powerline_symbols = 'unicode'
filetype plugin indent on     " required!

" Common typos fixed.
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

" relative line numbers are so awesome for someone not good with markers like me
"set relativenumber

" lines of visible b4 scroll
set scrolloff=6

hi clear

" configure statusline (currently using vim-airline)
set laststatus=2
"let g:airline_theme="bubblegum"               " https://github.com/vim-airline/vim-airline/wiki/Screenshots
let g:airline_theme="one"                     " rakr/vim-one
let g:airline_powerline_fonts = 1             " hot fonts! https://github.com/powerline/fonts
let g:airline_detect_spell=0                  " disable the pointless SPELL> marker in the statusline
" let g:airline#extensions#syntastic#enabled=1
" let g:airline#extensions#default#section_truncate_width = {
"     \ 'b': 110,
"     \ 'x': 100,
"     \ 'y': 110,
"     \ 'z': 50,
"     \ 'warning': 90,
"     \ 'error': 90,
"     \ }

" configure greppers/searchers
if executable('pt')
  set grepprg=pt
endif

" Don't use Ex mode, use Q for formatting
map Q gq

"highlight clear SignColumn

filetype plugin indent on
syntax on
"set cursorline " show highlight on line with active cursor

let mapleader = "\<Space>"

set nobackup       "no backup files
set nowritebackup  "only in case you don't want a backup file while editing
set noswapfile     "no swap files
set number         "enable line number

filetype plugin on

highlight Pmenu ctermbg=238 gui=bold

au FileType go map <leader>r :!go run %<CR>

let g:tagbar_type_go = {
      \ 'ctagstype' : 'go',
      \ 'kinds'     : [
      \ 'p:package',
      \ 'i:imports:1',
      \ 'c:constants',
      \ 'v:variables',
      \ 't:types',
      \ 'n:interfaces',
      \ 'w:fields',
      \ 'e:embedded',
      \ 'm:methods',
      \ 'r:constructor',
      \ 'f:functions'
      \ ],
      \ 'sro' : '.',
      \ 'kind2scope' : {
      \ 't' : 'ctype',
      \ 'n' : 'ntype'
      \ },
      \ 'scope2kind' : {
      \ 'ctype' : 't',
      \ 'ntype' : 'n'
      \ },
      \ 'ctagsbin'  : 'gotags',
      \ 'ctagsargs' : '-sort -silent'
      \ }

" If you prefer the Omni-Completion tip window to close when a selection is
" " made, these lines close it on movement in insert mode or when leaving
" " insert mode
autocmd CursorMovedI * if pumvisible() == 0|pclose|endif
autocmd InsertLeave * if pumvisible() == 0|pclose|endif

autocmd StdinReadPre * let s:std_in=1

nmap <C-m> :TagbarToggle<CR>

"faith-go
let g:go_auto_type_info = 1
let g:go_fmt_command = "goimports"
let g:go_highlight_functions = 1
let g:go_highlight_methods = 1
let g:go_highlight_structs = 1
let g:go_highlight_operators = 1
let g:go_highlight_build_constraints = 1
let g:go_bin_path = expand("~/go/bin")


"Run commands, such as go run with <leader>r for the current file or go build and go test for the current package with <leader>b and <leader>t. Display a beautiful annotated source code to see which functions are covered with <leader>c.
au FileType go nmap <leader>r <Plug>(go-run)
au FileType go nmap <leader>b <Plug>(go-build)
au FileType go nmap <leader>t <Plug>(go-test)
au FileType go nmap <leader>c <Plug>(go-coverage)
au FileType go nmap <Leader>s <Plug>(go-implements)

"By default the mapping gd is enabled which opens the target identifier in current buffer. You can also open the definition/declaration in a new vertical, horizontal or tab for the word under your cursor:
au FileType go nmap <Leader>ds <Plug>(go-def-split)
au FileType go nmap <Leader>dv <Plug>(go-def-vertical)
au FileType go nmap <Leader>dt <Plug>(go-def-tab)

"Open the relevant Godoc for the word under the cursor with <leader>gd or open it vertically with <leader>gv
au FileType go nmap <Leader>gd <Plug>(go-doc)
au FileType go nmap <Leader>gv <Plug>(go-doc-vertical)

"Or open the Godoc in browser
au FileType go nmap <Leader>gb <Plug>(go-doc-browser)

"Show a list of interfaces which is implemented by the type under your cursor with <leader>s
au FileType go nmap <Leader>s <Plug>(go-implements)

"Show type info for the word under your cursor with <leader>i (useful if you have disabled auto showing type info via g:go_auto_type_info)
au FileType go nmap <Leader>i <Plug>(go-info)

"Rename the identifier under the cursor to a new name
au FileType go nmap <Leader>e <Plug>(go-rename)
"More <Plug> mappings can be seen with :he go-mappings. Also these are just recommendations, you are free to create more advanced mappings or functions based on :he go-commands.

" Make gf work on Chef include_recipe lines
" Add all cookbooks/*/recipe dirs to Vim's path variable
autocmd BufRead,BufNewFile */cookbooks/*/recipes/*.rb setlocal path+=recipes;/cookbooks/**1

" colorscheme config
syntax enable
set background=dark
"let g:solarized_termcolors=16
"let g:solarized_visibility =  "low"
"let g:solarized_visibility = "high"
"let g:solarized_contrast = "high"
"colorscheme solarized
"colorscheme bubblegum
colorscheme one  " rakr/vim-one
"colorscheme space-vim-dark

nmap <silent> <F2> <Plug>DashSearch
nmap <silent> <F3> <Plug>DashSearch

" golint https://github.com/golang/lint
set rtp+=$GOPATH/src/github.com/golang/lint/misc/vim

" AutoFormat on write
noremap <F3> :Autoformat<CR><CR>

setlocal spell spelllang=en_us
set nospell                      " disable spelling in general, enable only for specific file types because it gets really annoying in source code
autocmd FileType markdown set spell
autocmd FileType text set spell

"highlight ExtraWhitespace ctermbg=red guibg=red

" ntpeters/vim-better-whitespace config:
let g:better_whitespace_filetypes_blacklist=['diff', 'gitcommit', 'unite', 'qf', 'help']

" ---------------- begin list toggle code ----------------------
"  http://vim.wikia.com/wiki/Toggle_to_open_or_close_the_quickfix_window
" function to provide toggling of the location-list (Syntastic) and quickfix
" windows
function! GetBufferList()
  redir =>buflist
  silent! ls!
  redir END
  return buflist
endfunction

function! ToggleList(bufname, pfx)
  let buflist = GetBufferList()
  for bufnum in map(filter(split(buflist, '\n'), 'v:val =~ "'.a:bufname.'"'), 'str2nr(matchstr(v:val, "\\d\\+"))')
    if bufwinnr(bufnum) != -1
      exec(a:pfx.'close')
      return
    endif
  endfor
  if a:pfx == 'l' && len(getloclist(0)) == 0
      echohl ErrorMsg
      echo "Location List is Empty."
      return
  endif
  let winnr = winnr()
  exec(a:pfx.'open')
  if winnr() != winnr
    wincmd p
  endif
endfunction

nmap <silent> <leader>l :call ToggleList("Location List", 'l')<CR>
nmap <silent> <leader>q :call ToggleList("Quickfix List", 'c')<CR>
" ---------------- end list toggle code ----------------------

" set a vertical marker at the 80th and 120th columns on text files
fun! EnableColorColumn()
    if exists('b:ShowColorColumn')
        let &colorcolumn="80,".join(range(120,999),",")
    else
        let &colorcolumn=''
    endif
endfun
autocmd FileType markdown,text let b:ShowColorColumn = 1
autocmd FileType * call EnableColorColumn()

" disable auto-pairs plugin for [] on markdown, it drives me crazy with the auto-spacing
"au Filetype markdown let b:AutoPairs = {'(':')', '{':'}',"'":"'",'"':'"', '`':'`'}
let g:AutoPairsMapSpace=0

" map tab to scroll thru splits
nnoremap <Tab> <c-w>w

" SPC SPC - visual mode
nmap <Leader><Leader> V

" SPC [1-9] - switch to tab 1 through 9
noremap <silent> <leader>1 1gt
noremap <silent> <leader>2 2gt
noremap <silent> <leader>3 3gt
noremap <silent> <leader>4 4gt
noremap <silent> <leader>5 5gt
noremap <silent> <leader>6 6gt
noremap <silent> <leader>7 7gt
noremap <silent> <leader>8 8gt
noremap <silent> <leader>9 9gt

" SPC w - fast save
nnoremap <Leader>w :w<CR>
" SPC q a - quit-all
nnoremap <Leader>qa :qa<CR>
" SPC q - quit
nnoremap <Leader>q :q<CR>

" SPC f r - Reload .vimrc (from space-vim: https://github.com/liuchengxu/space-vim/blob/master/layers/%2Bvim/better-defaults/README.md#others
nnoremap <Leader>fR :source $MYVIMRC<CR>

" SPC n / SPC p - next tab / prev tab
map <Leader>n :tabnext<CR>
map <Leader>p :tabprev<CR>

" SPC with no action within timeoutlen brings up which-key list of available hotkeys
nnoremap <silent> <leader> :WhichKey '<Space>'<CR>

" ALT tab - switch tabs
map    <M-Tab>  :tabprev<CR>
imap   <M-Tab>  <C-O>:tabprev<CR>


highlight link SyntasticErrorSign        SignColumn
highlight link SyntasticWarningSign      SignColumn
highlight link SyntasticStyleErrorSign   SignColumn
highlight link SyntasticStyleWarningSign SignColumn
let g:syntastic_stl_format = "[%E{❌ %fe #%e}%B{|}%W{⚠️ %fw #%w}]"

" neomake settings
"let g:neomake_open_list=1
"autocmd! BufWritePost * Neomake

" gist config
let g:gist_post_private = 1         " private gists by default
let g:gist_show_privates = 1        " show private gists with :Gist -l

" ctrlp config
let g:ctrlp_dont_split = 'nerdtree|NERD' " don't open files in the nerdtree pane. this can be a regex
" open files from ctrlp in a new tab by default (https://github.com/kien/ctrlp.vim/issues/160)
let g:ctrlp_prompt_mappings = {
    \ 'AcceptSelection("e")': ['<c-t>'],
    \ 'AcceptSelection("t")': ['<cr>', '<2-LeftMouse>'],
    \ }
" fast opening cltrp with SPC-o
nnoremap <Leader>o :CtrlP<CR>

" tabline config
"hi TabLineSel   ctermfg=236    ctermbg=150  cterm=NONE   " roughly matches the bubblegum dark theme
hi TabLine      ctermfg=Black  ctermbg=Green     cterm=NONE
hi TabLineFill  ctermfg=Black  ctermbg=Green     cterm=NONE
hi TabLineSel   ctermfg=White  ctermbg=DarkBlue  cterm=NONE

" gitgutter config
" if emoji#available()
"     let g:gitgutter_sign_added = emoji#for('small_blue_diamond')
"     let g:gitgutter_sign_modified = emoji#for('small_orange_diamond')
"     let g:gitgutter_sign_removed = emoji#for('small_red_triangle')
"     let g:gitgutter_sign_modified_removed = emoji#for('collision')
" endif

" autoreload files that are changed externally whenever a tab/buffer regains focus.
" This is particularly useful with the `make readme-toc` command which updates
" the TOC in a readme: https://github.com/pantheon-systems/markdown-toc-docker#makefile-usage
" From the 'alternative section' of this answer: http://vim.wikia.com/wiki/Have_Vim_check_automatically_if_the_file_has_changed_externally
set autoread
au FocusGained,BufEnter * :silent! !

" NERDTree settings
"nmap <C-n> :NERDTreeToggle<CR>
nmap <C-n> :NERDTreeTabsToggle<CR>
let g:NERDTreeShowHidden=1
let g:NERDTreeWinSize= 23 " smaller than default 31

" vim-nerdtree-tabs configuration - https://github.com/jistr/vim-nerdtree-tabs#configuration
let g:nerdtree_tabs_open_on_console_startup = 2
let g:nerdtree_tabs_focus_on_files = 1
let g:nerdtree_tabs_focus_on_files = 1

" crazy shit needed for 24-bit truecolor mode inside tmux 2.3+
" https://github.com/lifepillar/vim-solarized8/issues/1#issuecomment-226959344
set t_8f=[38;2;%lu;%lu;%lum  " Needed in tmux
set t_8b=[48;2;%lu;%lu;%lum  " Ditto

" lower timeouts for moving between modes
set timeoutlen=1000 ttimeoutlen=0

" gabrielelana/vim-markdown settings
" - leader + t will toggle a checkbox on a list item, see: https://github.com/gabrielelana/vim-markdown#default-mappings-normal-and-visual-mode
let g:markdown_mapping_switch_status = '<Leader>t'

" YouCompleteMe (ycm) configuration
" - Use relative path to python bin so that virtualenv python will be found and autocompletion for libs in the virtualenv will work - https://github.com/Valloric/YouCompleteMe#python-semantic-completion
let g:ycm_python_binary_path = 'python'

" Startify configuration
let g:startify_session_dir = '~/.vim/sessions'
let g:startify_bookmarks = [ '~/.dotfiles', '~/.vimrc', '~/.zshrc' ]
let g:startify_session_before_save = [ 'echo "Cleaning up before saving.."', 'silent! NERDTreeTabsClose', ]
let g:startify_session_persistence = 1
let g:startify_session_autoload = 1
let g:startify_files_number = 6
" make startify + nerdtree start together when vim is started with no args
autocmd VimEnter *
            \   if !argc()
            \ |   Startify
            \ |   NERDTree
            \ |   wincmd w
            \ | endif
" deoplete config
let g:deoplete#enable_at_startup = 1

let g:deoplete#omni_patterns = {}
let g:deoplete#omni_patterns.terraform = '[^ *\t"{=$]\w*'

" configure deoplete to use gopls: https://github.com/fatih/vim-go/pull/2231/files
call deoplete#custom#option('omni_patterns', { 'go': '[^. *\t]\.\w*' })

" Let <Tab> also do completion
inoremap <silent><expr> <Tab>
\ pumvisible() ? "\<C-n>" :
\ deoplete#mappings#manual_complete()

" Close the documentation window when completion is done
autocmd InsertLeave,CompleteDone * if pumvisible() == 0 | pclose | endif

" ------------------- begin linters config -----------------------
" There is configuration for both ale and syntastic below, but only one is
" active. Check the Plugin's list at the top for which is active. I tend to
" switch back and forth
" -----------------------------------------------------------------
" ale (async lint engine) config
"let g:ale_linters = {'go': ['gometalinter']}
let g:ale_linters = {'go': ['go build', 'gofmt', 'golint', 'errcheck', 'go vet']}
let g:ale_lint_on_enter = 1
let g:ale_lint_on_save = 1
let g:ale_lint_on_text_changed = 'never'
let g:ale_sign_column_always = 1
" these emojis cause problems in tmate
" let g:ale_sign_error = '✗'
" let g:ale_sign_warning = '⚠'
let g:ale_sign_error = 'E'
let g:ale_sign_warning = 'W'
let g:airline#extensions#ale#enabled = 1

" linters to install:
"  - shellcheck (brew install shellcheck)
"  - go-metalinter (go get -u github.com/alecthomas/gometalinter ;  gometalinter --install --update)
"  - yamllint (pip install yamllint)
"  - jsonlint (brew install jsonlint)

" syntastic (uncomment Plugin to enable)
let g:syntastic_always_populate_loc_list = 1
let g:syntastic_auto_loc_list = 2
let g:syntastic_check_on_open = 1
let g:syntastic_check_on_wq = 1
let g:syntastic_ruby_checkers = ['mri', 'rubocop', 'rubylint']
let g:syntastic_python_checkers = ['python', 'pylint']
autocmd BufRead,BufNewFile */titan/* let g:syntastic_python_checkers=['python']  " disable pylint when working in the titan project
" NOTE: gometalinter is too slow to run all the linters on most projects. disabled for now.
"let g:syntastic_go_checkers = ['gometalinter']
let g:syntastic_go_checkers = ['go', 'golint', 'govet', 'errcheck', 'deadcode']
"let g:syntastic_go_checkers = ['golint', 'govet', 'errcheck', 'deadcode']
"let g:syntastic_go_checkers = ['go', 'govet']
let g:syntastic_yaml_checkers = ['yamllint']
let g:syntastic_yaml_yamllint_args = '-c ' . shellescape($HOME . '/.yamllint')
let g:syntastic_json_checkers = ['jsonlint']

" NOTE: there are issues with multi-byte emojis in at least Neovim currently (9/2016): https://github.com/neovim/neovim/issues/5149
"TODOif emoji#available()
" 	let g:syntastic_error_symbol         = emoji#for('x')
" 	let g:syntastic_warning_symbol       = emoji#for('warning')
" 	let g:syntastic_style_error_symbol   = emoji#for('interrobang')
" 	let g:syntastic_style_warning_symbol = emoji#for('poop')
" elseif has('multi_byte') && &encoding ==# 'utf-8'
" 	let g:syntastic_error_symbol         = '✗'
" 	let g:syntastic_warning_symbol       = '⚠'
" 	let g:syntastic_style_error_symbol   = '»»'
" 	let g:syntastic_style_warning_symbol = '»'
" else
" 	let g:syntastic_error_symbol         = 'E'
" 	let g:syntastic_warning_symbol       = 'W'
" 	let g:syntastic_style_error_symbol   = 'S'
" 	let g:syntastic_style_warning_symbol = 's'
" endif
" ------------------- end linters config -----------------------
" these emojis cause problems in tmate, so we use basic chars for now
let g:syntastic_error_symbol         = 'E'
let g:syntastic_warning_symbol       = 'W'
let g:syntastic_style_error_symbol   = 'S'
let g:syntastic_style_warning_symbol = 's'

" Align GitHub-flavored Markdown tables (Plug 'junegunn/vim-easy-align')
" The <Bslash> key is also the | key, a mnemonic when looking at the |s of the table.
au FileType markdown vmap <Leader><Bslash> :EasyAlign*<Bar><Enter>

" disable fatih/vim-hclfmt on *.tf and *.tfvars files
let g:tf_fmt_autosave = 0

" enable hashivim/tterraform fmt'ing on *.tf *.tfvars files
let g:terraform_align=1
let g:terraform_fmt_on_save=1

