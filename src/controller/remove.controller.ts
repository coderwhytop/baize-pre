import { commandService } from "@/service/command.service";
import { installerService } from "@/service/installer.service";
import { loggerService } from "@/service/logger.service";
import { PluginService } from "@/service/plugin.service";

export class RemoveController {
  static key = "remove";
  constructor(args: string[] = []) {
    // 检查是否有 --all 参数
    if (args.includes("--all")) {
      installerService.removeAll().then(() => {
        loggerService.finish(RemoveController.key);
      });
    } else {
      const pluginNames = args.filter(arg => !arg.startsWith("-"));
      const pluginService = new PluginService(false);
      const matInstalls = pluginService
        .get()
        .filter(item => pluginNames.includes(item.name));
      if (!matInstalls.length) {
        const pluginStr = pluginService.getAll().join(" | ").trim();
        loggerService.error(
          `Error: ${commandService.main} "is only allow to remove ${pluginStr}.`
        );
      } else {
        installerService
          .uninstall(matInstalls)
          .then(() => loggerService.finish(RemoveController.key));
      }
    }
  }
}
