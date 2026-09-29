# Tabby SSH Image Paste

在 Windows 的 Tabby 中复制截图，按 `Ctrl+Shift+V`，把图片上传到当前 SSH 连接的服务器，并将图片路径填入终端。配合 [codex24h](https://github.com/Vinnish-A/codex24h)，可以直接给远程 Codex 发图片。

基于 [CoderRed 的 tabby-ssh-image-clipboard](https://github.com/coderredlab/tabby-ssh-image-clipboard)，保留 MIT 许可和原作者署名。本版修复首次打开 SSH 标签页时图片粘贴没有反应的问题。

## 安装到 Windows Tabby

插件名：**`tabby-ssh-image-paste`**；设置页名称：**SSH Image Paste**。

此版本尚未发布到 npm / Tabby 插件商店，请从本仓库安装：

1. [下载 ZIP](https://github.com/Vinnish-A/tabby-ssh-image-paste/archive/refs/heads/main.zip)，解压。
2. 在文件资源管理器地址栏输入 `%APPDATA%\tabby\plugins\node_modules`。目录不存在时自行创建。
3. 将解压出的 `tabby-ssh-image-paste-main` 文件夹改名为 `tabby-ssh-image-paste`，放入上述目录。
4. 完全退出并重新打开 Tabby。

最终应能找到：

```text
%APPDATA%\tabby\plugins\node_modules\tabby-ssh-image-paste\package.json
%APPDATA%\tabby\plugins\node_modules\tabby-ssh-image-paste\dist\index.js
```

仓库包含编译结果，不需要 Node.js、PowerShell 脚本或自行编译。如果装过原版 `tabby-ssh-image-clipboard`，先在 Tabby 插件管理中卸载原版，避免两份插件同时处理粘贴。升级本版时，退出 Tabby 后替换本插件文件夹即可。

## 使用

1. 在 Tabby 中连接 Linux / WSL 的 SSH 服务，启动 `codex24h`。
2. 截图或复制图片本身到 Windows 剪贴板。
3. 在远程终端按 `Ctrl+Shift+V`（若改过快捷键，使用 Tabby 的“粘贴”快捷键）。
4. 图片上传后，Codex 输入框会识别图片附件；输入问题后发送。

上传使用当前 SSH 连接的 SFTP，无需额外账号、服务端插件或重新登录 Codex。服务器需要支持 SFTP，且 `/tmp` 可写。文件保存为 `/tmp/clipboard_<时间戳>.png`，本插件不负责自动删除。

只复制文件名或资源管理器中的文件不等于复制图片内容。没有图片时仍由 Tabby 处理普通文本粘贴；此插件不会阻止 Tabby 自身的粘贴处理，剪贴板同时有图片和文本时也可能出现文本。

## 验证范围

已在 Windows Tabby 1.0.237 → SSH → Linux / WSL → codex24h / Codex 0.158.0 链路验证：首次连接后粘贴图片、SFTP 落盘、Codex 显示图片附件并正确回答图片颜色。其他平台和版本尚未实测。

若无反应，检查剪贴板是否有图片、SSH 是否连接完成、SFTP 是否可用，以及设置中的 **SSH Image Paste** 是否启用。

## 开发

```bash
npm ci
npm run build
```

更新源码后请一并提交 `dist/`，以便下载 ZIP 的用户直接安装。

## 版权

原作：Copyright (c) CoderRed。原作者网站：[coderred.com](https://coderred.com)。

本分支修改：Copyright (c) 2026 Vinnish-A。

遵循 [MIT License](LICENSE)，保留上游提交历史；上游文档见 [README.upstream.md](README.upstream.md) 和 [README.ko.md](README.ko.md)，其中安装方式指向原版，不适用于本分支。
