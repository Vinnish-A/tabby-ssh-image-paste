# Tabby SSH Image Clipboard

[![npm version](https://badge.fury.io/js/tabby-ssh-image-clipboard.svg)](https://www.npmjs.com/package/tabby-ssh-image-clipboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Paste clipboard images directly to remote SSH servers via SFTP in [Tabby](https://tabby.sh) terminal.

![Demo](https://raw.githubusercontent.com/coderredlab/tabby-ssh-image-clipboard/main/demo.gif)

## Why?

When using AI coding assistants like **Claude Code** or **OpenCode** on remote servers, sharing screenshots is painful. You have to manually upload images via SCP/SFTP, find the path, and type it out. This plugin eliminates all of that — just copy an image and paste it.

## Features

- **One-key paste** — `Ctrl+Shift+V` (Tabby's default paste hotkey) uploads clipboard images via SFTP and outputs the quoted file path to terminal
- **Smart detection** — Only triggers when the clipboard contains an image. If there's no image, normal text paste behavior is preserved
- **Zero configuration** — Works out of the box with any SSH connection that supports SFTP
- **Split tab support** — Works with Tabby's split pane layout, correctly detecting the active SSH session
- **Configurable notifications** — Optional success/error notifications (can be toggled in settings)

## How It Works

1. You press `Ctrl+Shift+V` while in an SSH tab
2. The plugin checks if the clipboard contains an image
3. If yes: converts to PNG → uploads via SFTP to `/tmp/clipboard_<timestamp>.png` → types the quoted path into the terminal
4. If no: falls through to Tabby's normal text paste

The uploaded image path is automatically quoted (e.g., `"/tmp/clipboard_1234567890.png"`), so you can directly use it as an argument for CLI tools or AI assistants.

## Installation

### From Tabby Plugin Manager (Recommended)

1. Open Tabby Settings
2. Go to **Plugins**
3. Search for `tabby-ssh-image-clipboard`
4. Click **Install**
5. Restart Tabby

### From npm

```bash
npm install -g tabby-ssh-image-clipboard
```

### From Source

```bash
git clone https://github.com/coderredlab/tabby-ssh-image-clipboard.git
cd tabby-ssh-image-clipboard
npm install
npm run build
```

Then link it to Tabby's plugin directory:

**Windows:**
```bash
npm link
cd %APPDATA%\tabby\plugins
npm link tabby-ssh-image-clipboard
```

**macOS/Linux:**
```bash
npm link
cd ~/.config/tabby/plugins
npm link tabby-ssh-image-clipboard
```

Restart Tabby after linking.

## Usage

1. Connect to an SSH server in Tabby
2. Copy an image to your clipboard (screenshot, browser image, etc.)
3. Press `Ctrl+Shift+V`
4. The image is uploaded to `/tmp/clipboard_<timestamp>.png` on the remote server
5. The quoted file path appears in your terminal, ready to use

### Example with Claude Code

```
$ claude
> Here's the screenshot of the error: "/tmp/clipboard_1707500000000.png"
```

## Settings

Open Tabby Settings → **Plugins** → **Clipboard Sync**:

| Setting | Default | Description |
|---------|---------|-------------|
| **Enabled** | `true` | Enable or disable the plugin |
| **Show Notifications** | `true` | Show success/error toast notifications |

## Requirements

- Tabby 1.0.x or later
- SSH server with SFTP support
- Remote server with a writable `/tmp/` directory (Linux/macOS)

## Troubleshooting

### Image paste not working

- Make sure you're in an active SSH tab (not a local terminal)
- Check that the SSH connection supports SFTP
- Verify the plugin is enabled in Settings → Plugins → Clipboard Sync

### Nothing happens on Ctrl+Shift+V

- If the clipboard has no image, Tabby performs a normal text paste — this is expected behavior
- Check that the SSH session is fully connected (wait for the shell prompt)

### Permission denied on remote server

- Ensure `/tmp/` is writable on the remote server
- Some hardened servers may restrict SFTP access

## Building from Source

```bash
npm install          # Install dependencies
npm run build        # Production build → dist/index.js
npm run watch        # Development build with file watching
npm run lint         # Run ESLint
```

## License

MIT
