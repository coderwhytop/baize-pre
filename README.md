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
- 渐进式：`init` 与 `install` 命令覆盖新老项目场景
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
baize all
# 一次性安装并写入所有内置插件与配置
```

从官方模板创建新项目：

```bash
baize template
# 选择模板分支 → 输入项目名 → 自动克隆、改名并清理 .git
```

## 命令说明

- `baize init`：交互式选择并安装多个插件，按当前 Node.js 版本适配配置。
- `baize install <plugin...>`：安装并配置指定插件（若名称不匹配会给出可选列表）。
- `baize uninstall <plugin...>`：卸载指定插件并移除对应配置。
- `baize all`：一键安装所有内置插件（默认包含 Prettier、Husky、TypeScript）。
- `baize config get|set <default|plugin...>`：读取或设置 CLI 变量/插件配置，支持 `default`。
- `baize template`：选择 `baizeteam/baize-template` 分支，克隆模板、改名并删除 `.git`。
- `baize -h`：查看帮助；`baize -V`：查看当前版本。

## 常见用法示例

```bash
# 安装指定插件
baize install prettier husky

# 卸载指定插件
baize uninstall husky

# 查看/设置默认配置（示例）
baize config get default
baize config set default
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

## TODO

- 关于包管理器的使用策略：是“项目内仅选择一次”，还是“每次安装均询问”？
- 继续完善 TS 重构与别名路径配置

