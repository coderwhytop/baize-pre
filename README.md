## 介绍

Baize Pre 是一个面向前端项目的“规范化与初始化”脚手架，可在新/旧项目中一键接入并配置常用工程化工具（Prettier、Husky、TypeScript 等），帮助快速统一代码规范与提交流程，降低搭建成本与心智负担。

- 支持渐进式、低侵入地接入现有项目
- 一键为新项目生成并写入规范配置（如 `tsconfig.json`、`.prettierrc`、`.husky/pre-commit` 等）
- 若不存在 `.git`，可自动初始化 Git、创建 `.gitignore`，并设置 `core.ignorecase=false`

## 适用范围

仅依赖 Node.js，跨平台（Windows/macOS）与主流前端技术栈通用：Vue / React / Angular / Vite / Webpack / Rollup 等。

## 视频教程

（暂无）

## 特性与优势

- 低侵入：对存量项目改动小，可按需选择启用项
- 开箱即用：默认配置即合理，亦支持自定义
- 渐进式：`init` 命令覆盖新老项目场景
- 体积小：源码 < 100k，安装运行轻量
- 跨框架：不绑定具体框架，只要有 Node.js 即可使用

## 安装

全局安装（推荐）：

```bash
npm i -g baize-pre
# 或者
pnpm add -g baize-pre
```

项目本地安装：

```bash
pnpm add -D baize-pre
```

安装后可通过 `baize` 命令使用。

## 快速开始

在一个已存在的项目中渐进接入：

```bash
baize init
# 交互式选择并安装需要的插件（Prettier / Husky / TypeScript 等）
```

新项目一键规范化：

```bash
mkdir my-app && cd my-app
baize init --all
# 一次性安装并写入所有内置插件与配置
```

从官方模板创建新项目：

```bash
baize template
# 选择模板分支 → 输入项目名 → 自动克隆、改名并清理 .git
```

## 命令说明

- `baize init`：交互式选择并安装多个插件，按当前 Node.js 版本适配配置。使用 `baize init --all` 可一键安装所有内置插件。
- `baize template`：选择 `baizeteam/baize-template` 分支，克隆模板、改名并删除 `.git`。
- `baize -h`：查看帮助；`baize -V`：查看当前版本。

## 常见用法示例

```bash
# 交互式选择并安装插件
baize init

# 一键安装所有内置插件
baize init --all

# 从模板创建新项目
baize template
```

## 依赖与技术栈

- commander：命令与参数解析
- inquirer / readline-sync：交互式命令行
- chalk：命令行高亮输出
- simple-git / @octokit/rest：模板仓库克隆与分支查询

## 兼容性

- 仅需 Node.js 环境
- Windows / macOS 均可
- 可用于 Vue / React / Angular / Vite / Webpack / Rollup 等项目

## 期望与反馈

- 欢迎提出建议或参与共建，邮箱：1795691637@qq.com
- 如果对你有帮助，欢迎点个 Star～

## 更新日志

### v0.3.0 (2024-01-15)

#### 🎉 新功能

- **智能 lint-staged 配置**：根据已安装插件动态生成 `lint-staged` 配置，避免空配置导致的 git hook 错误
- **灵活的代码检查方式**：
  - 安装 husky → 自动配置 `lint-staged`，提交时自动运行代码检查
  - 不安装 husky → 在 `package.json` 的 `scripts` 中添加手动命令（如 `npm run format`、`npm run lint`）

#### 🔧 修复

- **修复依赖合并问题**：`devDependencies` 和 `dependencies` 现在正确合并而不是覆盖
- **修复 ESLint v9 兼容性**：迁移到新的 flat 配置格式（`eslint.config.js`）
- **修复 TypeScript 类型错误**：添加正确的类型断言和索引签名
- **修复 Husky v9 废弃警告**：更新 git hooks 配置

#### 🚀 优化

- **简化构建配置**：移除不再需要的 `template` 目录和 `store` 文件
- **动态插件检测**：插件系统现在直接从项目根目录读取配置文件，无需外部模板
- **更好的错误处理**：改进了安装过程中的错误提示和异常处理

#### 📝 技术改进

- 重构 `PluginService` 从项目自身配置文件读取，而非硬编码模板
- 优化 `InstallerService` 的 `#finalizeLintStaged` 方法，支持智能配置合并
- 更新 `PackageService` 的依赖合并逻辑，避免配置丢失
- 发布自动更新 npm 版本

## TODO

- 关于包管理器的使用策略：是"项目内仅选择一次"，还是"每次安装均询问"？
- 继续完善 TS 重构与别名路径配置
