# Changelog

## 0.1.1

- Fork as `tabby-ssh-image-paste`, retaining CoderRed’s MIT attribution and upstream history. Include prebuilt files for installation from the GitHub ZIP.
- Refresh the focused SSH session when pasting so the first connected tab can receive an image without switching tabs. Paste-time refresh does not register extra tab watchers or reuse a previous session when the current tab is not ready.
- Rename the settings page to SSH Image Paste and correct its paste shortcut hint.
