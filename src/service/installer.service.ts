import fsExtra from "fs-extra";
import { join } from "path";
import inquirer from "inquirer";
import { PackageService } from "@/service/package.service";
import { TYPE_PLUGIN_ITEM } from "@/type/plugin.type";
import { HUSKY } from "@/const/plugin.const";
import { MANAGER_LIST, PNPM } from "@/const/manager.const";
import { TYPE_MANAGER_NAME } from "@/type/manager.type";
import { loggerService } from "@/service/logger.service";
import { nodeService } from "@/service/node.service";
import { toolService } from "@/service/tool.service";
import { PluginService } from "@/service/plugin.service";
import { PackageInstance } from "@/instance/package.instance";
import { LoggerInstance } from "@/instance/logger.instance";
import { ToolInstance } from "@/instance/tool.instance";
import { NodeInstance } from "@/instance/node.instance";
import { InstallerInstance } from "@/instance/installer.instance";

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
    this.loggerService.success("You have chosen: " + result);
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
        ? managerName + " add "
        : managerName + " install ";
    // 如果是本地模块，则加上-D
    dev && (exec += " -D ");
    exec += pluginName;
    // 如果指定插件版本，则带上version
    version && (exec += "@" + version);

    try {
      // 捕获安装错误
      this.loggerService.warn("Installing " + pluginName + " ... ");
      this.toolService.execSync(exec);
      this.loggerService.success("Installed " + pluginName + " successfully. ");
    } catch (e) {
      this.loggerService.error("Error: install " + pluginName + " : ");
      console.log(e); // 承接上一行错误，但不要颜色打印
    }
  }
  async uninstall(plugins: TYPE_PLUGIN_ITEM[]) {
    // 卸载插件以及插件配置文件，由于包管理工具机制，比如你用npm安装，用yarn卸载某项，yarn执行完毕会去安装全部插件
    // 如果用户的包管理工具不一致，用户自己选择的，不能怪我们
    await this.chooseManager();
    for (let item of plugins) {
      const { name, config, pkgInject } = item;
      const pluginName = name;
      await this.#handleUninstall(pluginName)
        .then(async () => {
          // 移除配置项
          const files: string[] = Array.isArray(config)
            ? config.map((c: any) => c.file)
            : [config.file];
          if (pluginName === "husky") {
            const huskyDir = join(this.userPkg.curDir, ".husky");
            if (fsExtra.existsSync(huskyDir)) fsExtra.removeSync(huskyDir);
          } else {
            files.forEach(f => {
              const filepath = join(this.userPkg.curDir, f);
              if (fsExtra.existsSync(filepath)) fsExtra.removeSync(filepath);
            });
          }

          // 删除包信息配置
          let info = this.userPkg.get();
          for (let pkgKey in pkgInject as Record<string, any>) {
            if (info[pkgKey]) {
              const SCRIPTS = this.userPkg.script;
              // console.log(tool.isObject(pkgInject[pkgKey]), pkgKey, pkgInject, 'isObject')
              if (
                pkgKey === SCRIPTS &&
                this.toolService.isObject(
                  (pkgInject as Record<string, any>)[SCRIPTS]
                )
              ) {
                // 此时pkg[pkgKey] 等同于 pkgInject[SCRIPTS] 但后者语义好
                for (let scriptKey in (pkgInject as Record<string, any>)[
                  SCRIPTS
                ]) {
                  // SCRIPTS 里有这个键
                  if (info[SCRIPTS].hasOwnProperty(scriptKey)) {
                    // console.log('SCRIPTS 里有这个键', scriptKey, info[SCRIPTS])
                    // 多判断husky里携带的lint-staged
                    if (pluginName === HUSKY) {
                      const LINT = "lint-staged";
                      await this.#handleUninstall(LINT);
                      this.userPkg.remove(LINT, true);
                    } else {
                      this.userPkg.remove(scriptKey, true);
                    }
                  }
                }
              } else {
                // console.log(info[pkgKey], 'other')
                this.userPkg.remove(pkgKey);
              }
            }
          }
        })
        .catch(e => {
          console.log(e); // 承接上一行错误，但不要颜色打印
        });
    }
  }

  #handleUninstall(pkgName: string) {
    return new Promise((resolve, reject) => {
      this.userPkg.get();
      const { managerName } = this;
      let exec =
        managerName === "yarn"
          ? managerName + " remove "
          : managerName + " uninstall ";
      exec += pkgName;
      try {
        // 捕获安装错误
        this.loggerService.warn("Uninstalling " + pkgName + " ... ");
        this.toolService.execSync(exec);
        this.loggerService.success(
          "Uninstalled " + pkgName + " successfully. "
        );
        resolve(true);
      } catch (e) {
        this.loggerService.error("Error: uninstall " + pkgName + " : ");
        reject(e);
      }
    });
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
      } catch (_) {
        return this.loggerService.error(
          "Internal Error: Configuration injection failed in handleConfig."
        );
      }
    };
    Array.isArray(config) ? config.forEach(writeOne) : writeOne(config);
  }
  #updatePackage(pkgInject: Record<string, any>) {
    this.userPkg.get();
    // console.log(pkgInject, "有注入命令")
    for (let key in pkgInject) {
      // 更新用户json
      this.userPkg.update(key, pkgInject[key]);
    }
  }

  #mergeArrayUnique(target: string[] = [], more: string[] = []): string[] {
    const set = new Set([...(target || []), ...(more || [])]);
    return Array.from(set);
  }

  async #finalizeLintStaged() {
    // 根据已安装插件，合并 lint-staged 配置，不覆盖已有命令
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

    // 如果安装了 husky，配置 lint-staged
    if (hasHusky) {
      const lsKey = "lint-staged";
      const cur = (pkg as Record<string, any>)[lsKey] || {};
      const codeFiles = "*.{js,ts,vue,jsx,tsx,html}";
      const textFiles = "*.{json,md,yml,yaml}";

      const codeCmds: string[] = Array.isArray(cur[codeFiles])
        ? cur[codeFiles]
        : [];
      const textCmds: string[] = Array.isArray(cur[textFiles])
        ? cur[textFiles]
        : [];

      if (hasPrettier) {
        // 保证 prettier --write 存在
        cur[codeFiles] = this.#mergeArrayUnique(codeCmds, ["prettier --write"]);
        cur[textFiles] = this.#mergeArrayUnique(textCmds, ["prettier --write"]);
      }
      if (hasESLint) {
        // 保证 eslint --fix 存在
        const after = Array.isArray(cur[codeFiles]) ? cur[codeFiles] : [];
        cur[codeFiles] = this.#mergeArrayUnique(after, ["eslint --fix"]);
      }
      if (hasTypeScript) {
        const after = Array.isArray(cur[codeFiles]) ? cur[codeFiles] : [];
        // 提供类型检查脚本的占位，若用户已有则不会重复
        cur[codeFiles] = this.#mergeArrayUnique(after, [
          "node scripts/type-check.js",
        ]);
      }

      // 写回 pkg
      (pkg as Record<string, any>)[lsKey] = cur;
      this.userPkg.update(lsKey, cur);
    } else {
      // 如果没有安装 husky，在 scripts 中添加对应的脚本命令
      const scripts = pkg.scripts || {};

      if (hasPrettier) {
        scripts.format = "prettier --write .";
      }
      if (hasESLint) {
        scripts.lint = "eslint . --ext .ts,.tsx,.js";
      }
      if (hasTypeScript) {
        scripts.typecheck = "tsc --noEmit";
      }

      // 更新 scripts
      if (Object.keys(scripts).length > 0) {
        this.userPkg.update("scripts", scripts);
      }
    }
  }

  #checkGit() {
    this.userPkg.get();
    const gitPath = join(this.userPkg.curDir, ".git");
    // console.log(gitPath,'gitPath')
    if (!fsExtra.existsSync(gitPath)) {
      //  最好用 'dev' 作为默认分支名
      //  master就算不是默认分支时，都是不可删的
      this.toolService.execSync("git init -b dev");
      // 更改git默认不区分大小写的配置
      // 如果A文件已提交远程，再改为小写的a文件，引用a文件会出现本地正确、远程错误，因为远程还是大A文件)
      this.toolService.execSync("git config core.ignorecase false");
    }
  }
  async #checkHusky() {
    // 这一个依赖.git
    this.#checkGit();
    // 如果node版本小于16，使用@8版本插件
    this.toolService.execSync("npx " + HUSKY + " install");
    // console.log('checkhusky')
    await this.#handleInstall("lint-staged", true);
  }
  async install(plugins: TYPE_PLUGIN_ITEM[]) {
    await this.chooseManager();
    for (let pluginItem of plugins) {
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
    const questionKey = "plugins";
    this.pluginService = new PluginService(false);
    const storagePlugins = this.pluginService.getAll();
    
    // 使用更可靠的交互方式，避免 checkbox 键盘快捷键问题
    const selectedPlugins: string[] = [];
    let continueSelecting = true;
    
    console.log("Available plugins:");
    storagePlugins.forEach((plugin, index) => {
      console.log(`${index + 1}. ${plugin}`);
    });
    
    while (continueSelecting && selectedPlugins.length < storagePlugins.length) {
      const availablePlugins = storagePlugins.filter(plugin => !selectedPlugins.includes(plugin));
      
      if (availablePlugins.length === 0) break;
      
      const question = [
        {
          type: "list",
          name: "plugin",
          message: selectedPlugins.length > 0 
            ? `Selected: ${selectedPlugins.join(', ')}\nChoose another plugin (or 'Done' to finish):`
            : "Choose a plugin to install:",
          choices: [
            ...availablePlugins,
            new inquirer.Separator(),
            "Done"
          ],
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
}

export const installerService = new InstallerService();
