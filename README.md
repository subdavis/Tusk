# Tusk

> 一个现代、干净的 KeePass 浏览器扩展，使用 Vue.js 和 kdbxweb 构建。从 perfectapi/CKP 重启开发。

![Tusk](https://user-images.githubusercontent.com/25948390/45255427-a466f300-b386-11e8-9321-931934faafb4.png 'Tusk Logo')

## 🧟 死而复生 🧟

[阅读发布说明](https://github.com/subdavis/Tusk/releases/tag/v2024.8.2)，并随时关注更多更新！

## 安装

**Firefox:** https://addons.mozilla.org/en-GB/firefox/addon/keepass-tusk/

**Chrome:** https://chrome.google.com/webstore/detail/fmhmiaejopepamlcjkncpgpdjichnecm

## 用户指南

本节提供了 Tusk 各种功能的使用说明。

- [WebDAV 支持](https://github.com/subdavis/Tusk/wiki/WebDAV-Support) - 支持 WebDAV 文件服务器。
- [自定义字段](https://github.com/subdavis/Tusk/wiki/Custom-Fields) - Tusk 支持的自定义字段列表。
- [警告和错误](https://github.com/subdavis/Tusk/wiki/Warnings-and-Errors) - 您可能遇到的消息的解释。

#### 工作原理：实现细节

本节提供了 Tusk 内部工作原理的深入信息。我们旨在提供更好的透明度，让用户安心。Tusk 可能并不完美，但它比隐藏设计缺陷的专有黑盒应用程序要好。

- [凭证缓存内存](https://github.com/subdavis/Tusk/wiki/Credential-Cache-Memory) - Tusk 如何选择性地缓存您的主密码。
- [敏感数据](https://github.com/subdavis/Tusk/wiki/Sensitive-Data) - Tusk 如何处理敏感数据，如 KeePass 数据库和密钥文件。

## 构建设置

Tusk 需要：

- `node`
- `yarn`

```bash
# 安装依赖
yarn install

# 构建生产版本（带压缩）
yarn build
yarn pack:zip

# 热重载
yarn dev
```

## 运行测试

要运行测试，首先使用 `yarn build-tests` 或 `yarn watch-tests` 构建它们，然后在浏览器中打开 `tests/test.html`。

## 浏览器权限

> Tusk 需要跨域权限，以便代表用户注入凭证和查询存储后端。

在 Chrome 中，这些权限请求在**首次使用时总是**会提示用户。

由于 Firefox 对 `browser.permissions` 的实现，为了避免代码腐烂，有必要在安装时请求所有权限。有关 Firefox 权限的更深入解释，请查看 [Stack Overflow](https://stackoverflow.com/questions/47723297/firefox-extension-api-permissions-request-may-only-be-called-from-a-user-input)
