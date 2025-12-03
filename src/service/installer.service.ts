import type { InstallerInstance } from "@/types/installer.interface";
import type { LoggerInstance } from "@/types/logger.interface";
import type { TYPE_MANAGER_NAME } from "@/types/manager.types";
import type { NodeInstance } from "@/types/node.interface";
import type { PackageInstance } from "@/types/package.interface";
import type { TYPE_PLUGIN_ITEM } from "@/types/plugin.types";
import type { ToolInstance } from "@/types/tool.interface";
import { join } from "node:path";
import fsExtra from "fs-extra";
import inquirer from "inquirer";
import { MANAGER_LIST, PNPM } from "@/const/manager.const";
import { loggerService } from "@/service/logger.service";
import { nodeService } from "@/service/node.service";
import { PackageService } from "@/service/package.service";
import { PluginService } from "@/service/plugin.service";
import { toolService } from "@/service/tool.service";

class InstallerService implements InstallerInstance {
  private userPkg: PackageInstance;
  private managerName!: TYPE_MANAGER_NAME;
  private pluginService!: PluginService;
  private readonly loggerService: LoggerInstance = loggerService;
  private readonly toolService: ToolInstance = toolService;
  private readonly nodeService: NodeInstance = nodeService;

  constructor() {
    this.userPkg = new PackageService(true);
  }

  async chooseManager(): Promise<void> {
    const questionKey = "manager";
    const question = [
      {
        type: "list",
        name: questionKey,
        message: "Which package manager to use?",
        choices: MANAGER_LIST,
      },
    ];
    const answer = await inquirer.prompt(question);
    const result = answer[questionKey];
    this.loggerService.success(`You have chosen: ${result}`);
    const { preVersion, fullVersion } = this.nodeService.versions;
    if (preVersion < 16 && result === PNPM) {
      this.loggerService.error(
        `Sorry, your Node.js version is not supported by "${PNPM}".`
      );
      this.loggerService.error(`Expected >= 16, but got "${fullVersion}".`);
    } else {
      this.managerName = result;
    }
  }

  async #handleInstall(
    pluginName: string,
    dev: boolean = false,
    version: number | null = null
  ) {
    /** 必须在install前刷新一遍pkg的info,避免npm 安装时写入和我们的写入顺序冲掉了 */
    this.userPkg.get();
    const { managerName } = this;
    let exec =
      managerName === "yarn"
        ? `${managerName} add `
        : `${managerName} install `;
    // 如果是本地模块，则加上-D
    dev && (exec += " -D ");
    exec += pluginName;
    // 如果指定插件版本，则带上version
    version && (exec += `@${version}`);

    try {
      // 捕获安装错误
      this.loggerService.warn(`Installing ${pluginName} ... `);
      this.toolService.execSync(exec);
      this.loggerService.success(`Installed ${pluginName} successfully. `);
    } catch (e) {
      this.loggerService.error(`Error: install ${pluginName} : `);
      console.log(e); // 承接上一行错误，但不要颜色打印
    }
  }


  #handleConfig(
    config: { file: string; json: any } | Array<{ file: string; json: any }>
  ) {
    this.userPkg.get();
    const writeOne = (conf: { file: string; json: any }) => {
      const filepath = join(this.userPkg.curDir, conf.file);
      try {
        const { json } = conf;
        if (typeof json === "object")
          this.toolService.writeJSONFileSync(filepath, json);
        else fsExtra.writeFileSync(filepath, json);
      } catch (_unused) {
        return this.loggerService.error(
          "Internal Error: Configuration injection failed in handleConfig."
        );
      }
    };
    Array.isArray(config) ? config.forEach(writeOne) : writeOne(config);
  }

  #updatePackage(pkgInject: Record<string, any>) {
    this.userPkg.get();
    const pkg = this.userPkg.get();

    for (const key in pkgInject) {
      if (key === "scripts") {
        // 对于 scripts，不覆盖现有命令
        const existingScripts = pkg.scripts || {};
        const newScripts = pkgInject[key];

        // 只添加不存在的脚本
        for (const scriptKey in newScripts) {
          if (!existingScripts[scriptKey]) {
            existingScripts[scriptKey] = newScripts[scriptKey];
          }
        }

        this.userPkg.update(key, existingScripts);
      } else {
        // 其他配置直接更新
        this.userPkg.update(key, pkgInject[key]);
      }
    }
  }

  // #mergeArrayUnique(target: string[] = [], more: string[] = []): string[] {
  //   const set = new Set([...(target || []), ...(more || [])]);
  //   return Array.from(set);
  // }

  async #finalizeLintStaged() {
    // 根据已安装插件，配置 lint-staged，可以覆盖现有命令
    const pkg = this.userPkg.get();
    const hasPrettier = Boolean(
      pkg.devDependencies?.prettier || pkg.dependencies?.prettier
    );
    const hasESLint = Boolean(
      pkg.devDependencies?.eslint || pkg.dependencies?.eslint
    );
    const hasTypeScript = Boolean(
      pkg.devDependencies?.typescript || pkg.dependencies?.typescript
    );
    const hasHusky = Boolean(
      pkg.devDependencies?.husky || pkg.dependencies?.husky
    );

    // 如果安装了 husky，配置 lint-staged（可以覆盖现有配置）
    if (hasHusky) {
      const lsKey = "lint-staged";
      const codeFiles = "*.{js,ts,vue,jsx,tsx}";
      const textFiles = "*.{json,md,yml,yaml}";

      const lintStagedConfig: Record<string, string[]> = {};

      if (hasPrettier) {
        lintStagedConfig[codeFiles] = ["npx prettier --write"];
        lintStagedConfig[textFiles] = ["npx prettier --write"];
      }

      if (hasESLint) {
        if (lintStagedConfig[codeFiles]) {
          lintStagedConfig[codeFiles].unshift("npx eslint --fix");
        } else {
          lintStagedConfig[codeFiles] = ["npx eslint --fix"];
        }
      }

      if (hasTypeScript) {
        if (lintStagedConfig[codeFiles]) {
          lintStagedConfig[codeFiles].push("tsc --noEmit");
        } else {
          lintStagedConfig[codeFiles] = ["tsc --noEmit"];
        }
      }

      // 直接覆盖 lint-staged 配置
      this.userPkg.update(lsKey, lintStagedConfig);

      // 同时更新 lint-staged.config.mjs 文件
      const lintStagedConfigMjsPath = join(this.userPkg.curDir, "lint-staged.config.mjs");
      const configContent = `export default {\n${Object.entries(lintStagedConfig)
        .map(([pattern, commands]) => {
          const commandsStr = commands.map(cmd => `'${cmd}'`).join(", ");
          return `  '${pattern}': [${commandsStr}],`;
        })
        .join("\n")}\n}`;
      fsExtra.writeFileSync(lintStagedConfigMjsPath, configContent, "utf-8");
    } else {
      // 如果没有安装 husky，在 scripts 中添加对应的脚本命令（不覆盖现有命令）
      const scripts = pkg.scripts || {};

      if (hasPrettier && !scripts.format) {
        scripts.format = "prettier --write .";
      }
      if (hasESLint && !scripts.lint) {
        scripts.lint = "eslint . --ext .ts,.tsx,.js --fix";
      }
      if (hasTypeScript && !scripts.typecheck) {
        scripts.typecheck = "tsc --noEmit";
      }

      // 更新 scripts
      if (Object.keys(scripts).length > 0) {
        this.userPkg.update("scripts", scripts);
      }
    }
  }

  #createGitignore() {
    this.userPkg.get();
    const gitignorePath = join(this.userPkg.curDir, ".gitignore");

    // 如果 .gitignore 文件已存在，则不覆盖
    if (fsExtra.existsSync(gitignorePath)) {
      this.loggerService.warn(".gitignore already exists, skipping creation.");
      return;
    }

    // 从项目根目录读取 .gitignore 文件
    const projectGitignorePath = join(this.nodeService.root, ".gitignore");
    let gitignoreContent: string;

    if (fsExtra.existsSync(projectGitignorePath)) {
      try {
        gitignoreContent = fsExtra.readFileSync(projectGitignorePath, "utf-8");
      } catch (error) {
        this.loggerService.error("Failed to read .gitignore from project root:");
        console.log(error);
        return;
      }
    } else {
      // 如果项目根目录没有 .gitignore，使用默认内容
      this.loggerService.warn(
        ".gitignore not found in project root, using default content."
      );
      gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
jspm_packages/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.test
.env.production
.env.local
.env.development.local
.env.test.local
.env.production.local

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
public

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Logs
logs
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Build outputs
dist/
build/
out/

# Test coverage
coverage/
.nyc_output/

# Misc
*.tgz
*.tar.gz
`;
    }

    try {
      fsExtra.writeFileSync(gitignorePath, gitignoreContent);
      this.loggerService.success(".gitignore file created successfully.");
    } catch (error) {
      this.loggerService.error("Failed to create .gitignore file:");
      console.log(error);
    }
  }

  #checkGit() {
    this.userPkg.get();
    const gitPath = join(this.userPkg.curDir, ".git");
    if (!fsExtra.existsSync(gitPath)) {
      // 询问用户是否创建 git
      const question = [
        {
          type: "confirm",
          name: "createGit",
          message: "No git repository found. Do you want to create one?",
          default: true,
        },
      ];

      return inquirer.prompt(question).then((answer: any) => {
        if (answer.createGit) {
          this.toolService.execSync("git init -b master");
          // 忽略文件大小写
          this.toolService.execSync("git config core.ignorecase false");

          // 创建通用的 .gitignore 文件
          this.#createGitignore();

          this.loggerService.success(
            "Git repository initialized successfully."
          );
          return true;
        } else {
          this.loggerService.warn(
            "Git repository creation cancelled. Husky requires git to work properly."
          );
          return false;
        }
      });
    }
    return Promise.resolve(true);
  }

  async #checkHusky() {
    // 检查 git，如果没有则询问是否创建
    const gitReady = await this.#checkGit();
    if (!gitReady) {
      this.loggerService.warn(
        "Skipping husky installation: git repository required"
      );
      return; // 跳过 husky 安装，不抛出错误
    }

    // 如果 node 版本小于 16，使用 @8 版本插件
    const huskyVersion = this.nodeService.versions.preVersion < 16 ? 8 : null;

    // 安装 husky
    await this.#handleInstall("husky", true, huskyVersion);

    // 初始化 husky
    this.toolService.execSync("npx husky install");

    // 安装 lint-staged
    await this.#handleInstall("lint-staged", true);
  }

  async install(plugins: TYPE_PLUGIN_ITEM[]) {
    await this.chooseManager();
    for (const pluginItem of plugins) {
      const { name, config, dev, pkgInject } = pluginItem;
      const pluginName = name;
      await this.#handleInstall(
        pluginName,
        dev,
        pluginName === "husky" && this.nodeService.versions.preVersion < 16
          ? 8
          : null
      );
      // 顺序很重要，放最前面
      pluginName === "husky" && (await this.#checkHusky());
      // // 有需要合并的脚本
      pkgInject && (await this.#updatePackage(pkgInject));
      // // 有需要write的config文件
      config && this.#handleConfig(config);
    }
    await this.#finalizeLintStaged();
  }

  async choose() {
    this.pluginService = new PluginService(false);
    const storagePlugins = this.pluginService.getAll();

    // 使用更可靠的交互方式，避免 checkbox 键盘快捷键问题
    const selectedPlugins: string[] = [];
    let continueSelecting = true;

    console.log("Available plugins:");
    storagePlugins.forEach((plugin, index) => {
      console.log(`${index + 1}. ${plugin}`);
    });

    while (
      continueSelecting &&
      selectedPlugins.length < storagePlugins.length
    ) {
      const availablePlugins = storagePlugins.filter(
        plugin => !selectedPlugins.includes(plugin)
      );

      if (availablePlugins.length === 0) break;

      const question = [
        {
          type: "list",
          name: "plugin",
          message:
            selectedPlugins.length > 0
              ? `Selected: ${selectedPlugins.join(", ")}\nChoose another plugin (or 'Done' to finish):`
              : "Choose a plugin to install:",
          choices: [...availablePlugins, new inquirer.Separator(), "Done"],
        },
      ];

      const answer = await inquirer.prompt(question);

      if (answer.plugin === "Done") {
        continueSelecting = false;
      } else {
        selectedPlugins.push(answer.plugin);
      }
    }

    if (selectedPlugins.length === 0) {
      this.loggerService.warn("No plugins selected. Installation cancelled.");
      return;
    }

    this.pluginService = new PluginService(false);
    const matInstalls = this.pluginService
      .get()
      .filter(item => selectedPlugins.includes(item.name));
    await this.install(matInstalls);
  }

  async installAll() {
    this.pluginService = new PluginService(false);
    const allPlugins = this.pluginService.get();
    await this.install(allPlugins);
  }
}

export const installerService = new InstallerService();
