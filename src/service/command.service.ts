import { CommandInstance } from "@/instance/command.instance";
import { PackageInstance } from "@/instance/package.instance";
import { PackageService } from "@/service/package.service";

class CommandService implements CommandInstance {
  private readonly packageService: PackageInstance;
  public readonly main: string;
  public readonly subs;
  constructor() {
    this.packageService = new PackageService(false);
    const pkgInfo = this.packageService.get();
    const binKeys = pkgInfo.bin ? Object.keys(pkgInfo.bin) : [];
    this.main = (binKeys[0] || "baize") + " ";
    this.subs = {
      init: {
        alias: "",
        description:
          "Choose and install multiple plugins, and configure them according to your Node.js version.",
        examples: [this.main + "init"],
      },
      install: {
        alias: "i",
        description:
          "Install and configure some plugins compatible with your Node.js version.",
        examples: [this.main + "i <plugin-name>"],
      },
      uninstall: {
        alias: "",
        description:
          "Uninstall some plugins and remove their configuration settings that are related to your Node.js version.",
        examples: [],
      },
      template: {
        alias: "t",
        description: "Create a new project with a template.",
        examples: [this.main + "template"],
      },
      all: {
        alias: "a",
        description:
          "Quickly install all plugins and configure them with your Node.js version.",
        examples: [this.main + "all"],
      },
      "*": {
        alias: "",
        description: "Command not found.",
        examples: [],
      },
    };
  }
}

export const commandService = new CommandService();
