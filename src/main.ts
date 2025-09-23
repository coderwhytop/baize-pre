import { join } from "path";
import fsExtra from "fs-extra";
import { Command } from "commander";
import "source-map-support/register.js";
import { MainModule } from "@/main.module";

class Entry {
  constructor(private readonly mainModule: MainModule) {
    const localPkgPath = join(this.mainModule.nodeService.root, "package.json");
    const localPkgInfo = JSON.parse(
      fsExtra.readFileSync(localPkgPath, "utf-8")
    );
    const commandList = this.mainModule.commandService.subs;
    const program = new Command();
    program
      .version(`${localPkgInfo.name}@${localPkgInfo.version}`)
      .usage("<command> [option]");
    for (let key in commandList) {
      const { alias, description } = commandList[key];
      const cmd = program
        .command(key) // 注册命令
        .alias(alias) // 自定义命令缩写
        .description(description); // 命令描述

      // 为 init 和 remove 命令添加 --all 选项
      if (key === "init" || key === "remove") {
        cmd.option("--all", "Install/remove all plugins");
      }

      cmd.action((options, command) => {
        const subExecWord: string = command.name();
        const modules = this.mainModule.getAll();
        for (let ModuleClass of modules) {
          if (
            subExecWord === ModuleClass.key ||
            subExecWord === commandList[ModuleClass.key].alias
          ) {
            // 将选项转换为参数
            const args = command.args.slice();
            if (options.all) {
              args.push("--all");
            }
            new ModuleClass(args);
          }
        }
      });
    }
    program.parse(process.argv);
  }
}

new Entry(new MainModule());
