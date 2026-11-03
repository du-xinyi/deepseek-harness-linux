# DeepSeek Harness Linux

[English](README.md) | 中文

基于 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 Linux 社区桌面发行版。DeepSeek Harness 是 DeepSeek AI 开发的开源智能体框架；本仓库提供 x64 和 arm64 的 deb 安装包、应用菜单图标，以及通过 GitHub Releases 分发的应用内更新。

**安装 deb 后，从应用菜单打开 DeepSeek Harness 即可。桌面应用会自动启动内置后端，无需先运行 `npx @deepseek-ai/dsh web`。**

[下载最新版](https://github.com/du-xinyi/deepseek-harness-linux/releases/latest) · [Linux 打包说明](apps/desktop/packaging/README.zh.md#local-linux-packages) · [上游文档](https://deepseek-harness.github.io/deepseek-harness/)

<a id="install-and-launch"></a>

## 安装与启动

桌面发行版面向 Debian/Ubuntu 系统，安装包仅提供 deb 格式。

1. 确认系统架构：

   ```sh
   dpkg --print-architecture
   ```

2. 打开[最新发行版](https://github.com/du-xinyi/deepseek-harness-linux/releases/latest)，下载对应安装包：

   | 系统架构 | 安装包文件名 |
   | --- | --- |
   | `amd64`（Intel/AMD x64） | `deepseek-harness-…-linux-amd64-unsigned.deb` |
   | `arm64`（ARM64） | `deepseek-harness-…-linux-arm64-unsigned.deb` |

3. 在下载的安装包所在目录，将 `VERSION` 替换为文件名中的完整版本号，再执行安装。以下以 amd64 为例：

   ```sh
   sudo apt install ./deepseek-harness-VERSION-linux-amd64-unsigned.deb
   ```

   arm64 系统请将命令中的 `amd64` 替换为 `arm64`。`apt` 会处理安装包声明的系统依赖。

4. 从应用菜单打开 **DeepSeek Harness**，按界面提示完成账号或模型访问配置。

安装包包含桌面界面、本地后端，以及内置 Node.js、Python 和 pnpm 运行时。无需另行安装 Node.js/npm，也不用保持终端运行。应用菜单中会显示启动图标；安装时不会在桌面上创建快捷方式。

<a id="automatic-updates"></a>

## 自动更新

应用通过 GitHub Releases 检查新版本。检查更新不会自动下载或安装：由你选择下载，再单独确认安装与重启。下载文件会通过 SHA-512 校验，deb 安装需要系统授权。

也可以从[发行页面](https://github.com/du-xinyi/deepseek-harness-linux/releases/latest)下载新版 deb，用上面的命令安装。更新检查或下载失败时，可在 GitHub 恢复可访问后重试，或采用手动安装方式。

<a id="developer-preview"></a>

## 开发者预览

这是独立维护的 Linux 社区发行版，与上游官方桌面发行渠道分开维护。DeepSeek Harness 仍处于开发者预览阶段，可能引入破坏兼容性的变更。使用前请阅读[安全说明](SAFETY.zh.md)。

<a id="run"></a>

## 运行

本节介绍可选的 Web 界面运行方式。已安装的桌面应用直接从应用菜单启动。

<a id="run-from-npm"></a>

### 通过 `npm` 运行

如需在浏览器中使用上游 npm 发行版，安装 Node.js 后运行：

```sh
npx @deepseek-ai/dsh web
```

此命令默认会在 `http://127.0.0.1:3080` 启动独立的 Web UI。浏览器使用方法见 [Web UI 指南](docs/user/guide/index.zh.md)。

<a id="run-from-source"></a>

### 从源码运行

源码开发需要 Node.js 24.9 或更新版本，以及 `package.json` 声明版本的 pnpm。准备好后运行：

```sh
git clone https://github.com/du-xinyi/deepseek-harness-linux.git
cd deepseek-harness-linux
pnpm install
pnpm run build
pnpm dsh web
```

桌面开发与原生 Linux deb 构建方法见[开发指南](docs/development.zh.md)和 [Linux 打包说明](apps/desktop/packaging/README.zh.md#local-linux-packages)。打包需使用与目标架构一致的 Linux 主机。

<a id="support-and-development"></a>

## 支持与开发

本仓库维护 Linux 桌面安装包与更新渠道。智能体框架和插件相关问题可前往[上游 Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions)交流。

智能体框架与插件相关内容见[上游仓库](https://github.com/deepseek-ai/deepseek-harness)、[用户指南](docs/user/guide/index.zh.md)和[架构文档](docs/architecture.zh.md)。参与贡献请阅读 [CONTRIBUTING.md](CONTRIBUTING.zh.md)；编程 agent 请遵循 [AGENTS.md](AGENTS.md)。

<a id="citation"></a>

## 引用

底层智能体框架由 DeepSeek AI 开发：

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

<a id="license"></a>

## 许可证

[MIT](LICENSE)。第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
