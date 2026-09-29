# Tabby SSH Image Paste

在 Windows 的 Tabby 中复制截图，按 `Ctrl+V` 或 `Ctrl+Shift+V`，把图片上传到当前 SSH 连接的服务器，并将图片路径填入终端。配合 [codex24h](https://github.com/Vinnish-A/codex24h)，可以直接给远程 Codex 发图片。

基于 [CoderRed 的 tabby-ssh-image-clipboard](https://github.com/coderredlab/tabby-ssh-image-clipboard)，保留 MIT 许可和原作者署名。本版修复首次打开 SSH 标签页时图片粘贴没有反应的问题。

## 安装到 Windows Tabby

插件名：**`tabby-ssh-image-paste`**；设置页名称：**SSH Image Paste**。

当前版本：**0.1.4**。尚未上架 npm / Tabby 插件商店。

1. [下载 ZIP](https://github.com/Vinnish-A/tabby-ssh-image-paste/archive/refs/heads/main.zip)，完整解压。
2. 双击 `install.cmd`，看到 `Installed tabby-ssh-image-paste 0.1.4` 即安装成功。
3. 保存工作，完全退出并重新打开 Tabby。

不需要管理员权限、Node.js，也不用自己打开 PowerShell 或输入命令。安装器会调用 Windows 自带的 PowerShell；如果系统策略禁止运行脚本，需要管理员处理该策略。旧版图片插件会移到 `%APPDATA%\tabby\plugins\backups`，其他插件不受影响。

## 自动更新

默认开启：Tabby 启动时后台检查 GitHub，成功检查后 24 小时内不重复检查。发现新版本会下载对应 Git tag 的文件，校验 SHA-256 后安装，并提示重新打开 Tabby。不会主动重启或断开 SSH；已打开的窗口继续运行原版本。

可在 **SSH Image Paste → Automatically update from GitHub** 关闭。无法连接 GitHub 时继续使用已安装版本，也可以重新下载 ZIP、双击安装来升级。插件代码安装在 `%APPDATA%\tabby\plugins\local-plugins\tabby-ssh-image-paste`，通过目录联接加载。

## 使用

1. 在 Tabby 的“配置和连接”中选择原生 SSH 连接，连接 Linux / WSL 并启动 `codex24h`。在 PowerShell / WSL 标签页中手动运行 `ssh` 不提供插件所需的 SFTP 会话，不能用本插件上传。
2. 截图或复制图片本身到 Windows 剪贴板。
3. 在远程终端按 `Ctrl+V` 或 `Ctrl+Shift+V`（若改过快捷键，使用 Tabby 的“粘贴”快捷键）。
4. 图片上传后，Codex 输入框会识别图片附件；输入问题后发送。

上传使用当前 SSH 连接的 SFTP，无需额外账号、服务端插件或重新登录 Codex。服务器需要支持 SFTP，且 `/tmp` 可写。文件保存为 `/tmp/clipboard_<时间戳>.png`，本插件不负责自动删除。

只复制文件名或资源管理器中的文件不等于复制图片内容。有图片且焦点位于原生 SSH 标签页时，Ctrl+V / Ctrl+Shift+V 上传图片并阻止同一次按键的文字粘贴；没有图片时保留原来的按键行为。自定义“粘贴”快捷键仍可使用，但 Tabby 也可能同时粘贴剪贴板中的文字。上传失败会显示错误提示。

## 验证范围

已在 Windows Tabby 1.0.237 → SSH → Linux / WSL → codex24h / Codex 0.158.0 链路验证：首次连接后粘贴图片、SFTP 落盘、Codex 显示图片附件并正确回答图片颜色。其他平台和版本尚未实测。

若无反应，检查剪贴板是否有图片、SSH 是否连接完成、SFTP 是否可用，以及设置中的 **SSH Image Paste** 是否启用。

## 开发

```bash
npm ci
npm run build
```

更新源码后请一并提交 `dist/` 和构建生成的 `update.json`。发布时将版本对应的 `v版本号` tag 与 main 一起推送；自动更新从该 tag 获取文件，不要修改已发布的 tag。

## 版权

原作：Copyright (c) CoderRed。原作者网站：[coderred.com](https://coderred.com)。

本分支修改：Copyright (c) 2026 Vinnish-A。

遵循 [MIT License](LICENSE)，保留上游提交历史；上游文档见 [README.upstream.md](README.upstream.md) 和 [README.ko.md](README.ko.md)，其中安装方式指向原版，不适用于本分支。
