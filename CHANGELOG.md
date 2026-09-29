# Changelog

## 0.1.4

- Use Tabby’s browser network stack for GitHub updates so system proxy and DNS settings work on Windows.

## 0.1.3

- Add a double-click Windows installer using Windows built-in tools; preserve other plugins and back up the old package.
- Check GitHub for updates on startup at most once a day, verify tagged artifact hashes, and apply updates to new windows without restarting SSH sessions. Updates can be disabled in settings.

## 0.1.2

- Handle image-only Ctrl+V and Ctrl+Shift+V directly in the focused SSH terminal; retain Tabby’s paste hotkey and ordinary text behavior.
- Use bracketed paste when supported so Codex receives the image path as a paste event.
- Show upload errors instead of silently failing, and keep the uploaded path in the original SSH tab if focus changes during transfer.

## 0.1.1

- Fork as `tabby-ssh-image-paste`, retaining CoderRed’s MIT attribution and upstream history. Include prebuilt files for installation from the GitHub ZIP.
- Refresh the focused SSH session when pasting so the first connected tab can receive an image without switching tabs. Paste-time refresh does not register extra tab watchers or reuse a previous session when the current tab is not ready.
- Rename the settings page to SSH Image Paste and correct its paste shortcut hint.
