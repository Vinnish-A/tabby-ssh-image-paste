# Tabby SSH Image Paste

在 Windows 的 Tabby 中复制截图，按 `Ctrl+V` 或 `Ctrl+Shift+V`，把图片上传到当前 SSH 连接的服务器，并将图片路径填入终端。配合 [codex24h](https://github.com/Vinnish-A/codex24h)，可以直接给远程 Codex 发图片。

基于 [CoderRed 的 tabby-ssh-image-clipboard](https://github.com/coderredlab/tabby-ssh-image-clipboard)，保留 MIT 许可和原作者署名。本版修复首次打开 SSH 标签页时图片粘贴没有反应的问题。

## 安装到 Windows Tabby

插件名：**`tabby-ssh-image-paste`**；设置页名称：**SSH Image Paste**。

当前版本：**0.1.5**。尚未上架 npm / Tabby 插件商店。

1. [下载 install.cmd](https://raw.githubusercontent.com/Vinnish-A/tabby-ssh-image-paste/main/install.cmd)，保存到电脑上（不要保存为 `.txt`）。
2. 双击脚本，它会从 GitHub 下载已发布版本并安装；看到 `Installed tabby-ssh-image-paste ...` 即成功。
3. 保存工作，完全退出并重新打开 Tabby。

以后需要更新时，**双击同一个脚本**即可，不用重新下载脚本或手动替换插件目录。不需要管理员权限、Node.js，也不用自己打开 PowerShell 或输入命令。脚本会调用 Windows 自带的 PowerShell；受组织脚本策略限制的电脑需由管理员处理。

**插件不再自动检查或下载更新。** 仅用户主动运行安装脚本时访问 GitHub；插件粘贴网页图片时仍会读取对应图片地址。旧版图片插件会备份到 `%APPDATA%\tabby\plugins\backups`，其他插件不受影响，安装不会重启 SSH。

从 0.1.3 / 0.1.4 升级后请完全退出并重新打开 Tabby，旧窗口中已加载的自动检查代码才会退出。插件安装在 `%APPDATA%\tabby\plugins\local-plugins\tabby-ssh-image-paste`，通过目录联接加载。

## 使用

1. 在 Tabby 的“配置和连接”中选择原生 SSH 连接，连接 Linux / WSL 并启动 `codex24h`。在 PowerShell / WSL 标签页中手动运行 `ssh` 不提供插件所需的 SFTP 会话，不能用本插件上传。
2. 截图、复制图片，或复制包含文字和图片的整段内容到 Windows 剪贴板。
3. 在远程终端按 `Ctrl+V` 或 `Ctrl+Shift+V`（若改过快捷键，使用 Tabby 的“粘贴”快捷键）。
4. 图片上传后，Codex 输入框会识别图片附件；输入问题后发送。

上传使用当前 SSH 连接的 SFTP，无需额外账号、服务端插件或重新登录 Codex。服务器需要支持 SFTP，且 `/tmp` 可写。文件保存为 `/tmp/clipboard_<UUID>.png`，本插件不负责自动删除。

整段图文按 HTML 中的文字、图片顺序插入，保留段落和换行，支持多张图片。图片先上传完，再依次送入 Codex；任何一张读取或上传失败都会提示，输入框不会被部分填入。使用 `Ctrl+V` / `Ctrl+Shift+V`；纯文字仍交给 Tabby。

支持 HTML 内嵌图片、公开 HTTP(S) 图片及可读取的本地 `file:` 图片。需登录才能读取的链接、其他应用私有的 `blob:` 图片、只有 RTF 而没有 HTML/位图的剪贴板尚不支持；此时需要复制原图片。没有 HTML 顺序信息、仅同时提供文字和位图时，按“文字、图片”插入。不会执行 HTML 脚本，也不会向图片网站发送浏览器登录 cookie。

只复制文件名或资源管理器中的文件不等于复制图片内容。终端需支持 bracketed paste，建议在 Codex 输入框中粘贴整段图文。

## 验证范围

已在 Windows Tabby 1.0.237 → SSH → Linux / WSL → codex24h / Codex 0.158.0 链路验证：首次连接后粘贴图片、SFTP 落盘、Codex 显示图片附件并正确回答图片颜色。另已验证无位图、仅 HTML 的“文字—图片—文字—图片—文字”剪贴板，在原生输入框显示两张附件及完整文字顺序。其他平台和版本尚未实测。

若无反应，检查剪贴板是否有图片、SSH 是否连接完成、SFTP 是否可用，以及设置中的 **SSH Image Paste** 是否启用。

## 开发

```bash
npm ci
npm run build
```

更新源码后请一并提交 `dist/`。发布时将 package.json 对应的 `v版本号` tag 与 main 一起推送；安装脚本从该 tag 获取文件，不要修改已发布的 tag。

`node tests/paste.cjs` 验证粘贴顺序、剪贴板快照、上传失败和原标签页输入。`tests/rich.cjs` 在 Tabby renderer 中运行，使用真实 DOM 和 Electron 图片解码器验证图文解析。

## 版权

原作：Copyright (c) CoderRed。原作者网站：[coderred.com](https://coderred.com)。

本分支修改：Copyright (c) 2026 Vinnish-A。

遵循 [MIT License](LICENSE)，保留上游提交历史；上游文档见 [README.upstream.md](README.upstream.md) 和 [README.ko.md](README.ko.md)，其中安装方式指向原版，不适用于本分支。
