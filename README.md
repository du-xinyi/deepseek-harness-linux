# DeepSeek Harness Linux

English | [中文](README.zh.md)

A community Linux desktop edition of [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness), the open-source agent harness developed by DeepSeek AI. This fork provides deb installers for x64 and arm64, application launcher icons, and in-app updates through GitHub Releases.

**Install the deb and open DeepSeek Harness from your application menu. The desktop app starts its bundled backend automatically; you do not need to run `npx @deepseek-ai/dsh web` first.**

[Download the latest release](https://github.com/du-xinyi/deepseek-harness-linux/releases/latest) · [Linux packaging](apps/desktop/packaging/README.md#local-linux-packages) · [Upstream documentation](https://deepseek-harness.github.io/deepseek-harness/)

## Install and launch

The desktop release is distributed as deb packages for Debian/Ubuntu-family systems. Only deb packages are published.

1. Check your system architecture:

   ```sh
   dpkg --print-architecture
   ```

2. Open the [latest release](https://github.com/du-xinyi/deepseek-harness-linux/releases/latest) and download the matching package:

   | System architecture | Package filename |
   | --- | --- |
   | `amd64` (Intel/AMD x64) | `deepseek-harness-…-linux-amd64-unsigned.deb` |
   | `arm64` (ARM64) | `deepseek-harness-…-linux-arm64-unsigned.deb` |

3. In the directory containing your downloaded package, replace `VERSION` with its full version number and install it. For amd64:

   ```sh
   sudo apt install ./deepseek-harness-VERSION-linux-amd64-unsigned.deb
   ```

   On arm64, replace `amd64` with `arm64` in the command. `apt` resolves the system dependencies declared by the package.

4. Open **DeepSeek Harness** from your application menu and follow the setup prompts to configure your account or model access.

The installer includes the desktop UI, local backend, and bundled Node.js, Python, and pnpm runtimes. You do not need to install Node.js/npm separately or keep a terminal running. The launcher icon appears in your application menu; installation does not create a shortcut on the desktop.

## Automatic updates

The app checks GitHub Releases for new versions. Checking does not download or install anything: you choose when to download, then separately confirm installation and restart. Downloads are checked against SHA-512 metadata, and deb installation requires system authorization.

You can also download a newer deb from the [release page](https://github.com/du-xinyi/deepseek-harness-linux/releases/latest) and install it using the same command above. If an update check or download fails, retry when GitHub is reachable or use this manual path.

## Developer preview

This is a community Linux distribution, maintained separately from upstream's official desktop releases. DeepSeek Harness is in developer preview and may introduce compatibility-breaking changes. Read the [safety notice](SAFETY.md) before use.

## Run

This section covers the optional Web interface. The installed desktop application launches directly through the application menu.

### Run from `npm`

To use the upstream npm release in a browser, install Node.js and run:

```sh
npx @deepseek-ai/dsh web
```

This command starts a separate Web UI at `http://127.0.0.1:3080` by default. See the [Web UI guide](docs/user/guide/index.md) for browser use.

### Run from source

For source development, install Node.js 24.9 or newer and the pnpm version declared in `package.json`, then run:

```sh
git clone https://github.com/du-xinyi/deepseek-harness-linux.git
cd deepseek-harness-linux
pnpm install
pnpm run build
pnpm dsh web
```

For desktop development and native Linux deb builds, see the [development guide](docs/development.md) and [Linux packaging guide](apps/desktop/packaging/README.md#local-linux-packages). Packaging runs on a Linux host matching the target architecture.

## Support and development

This repository maintains the Linux desktop packages and update channel. For questions about the agent framework and plugins, visit [upstream Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).

For the agent framework and plugins, start with the [upstream repository](https://github.com/deepseek-ai/deepseek-harness), [user guide](docs/user/guide/index.md), and [architecture](docs/architecture.md). Contributor guidance is in [CONTRIBUTING.md](CONTRIBUTING.md); coding agents follow [AGENTS.md](AGENTS.md).

## Citation

The underlying agent framework is developed by DeepSeek AI:

```bibtex
@misc{deepseek-harness2026,
  title={DeepSeek Harness: Everything is a Plugin},
  author={DeepSeek-AI},
  year={2026},
  publisher={GitHub},
  howpublished={\url{https://github.com/deepseek-ai/deepseek-harness}},
}
```

## License

[MIT](LICENSE). Third-party dependencies and their licenses are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
