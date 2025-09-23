import { NodeInstance } from "@/instance/node.instance";
import { nodeService } from "@/service/node.service";
import { CommandInstance } from "@/instance/command.instance";
import { commandService } from "@/service/command.service";
import { InitController } from "@/controller/init.controller";
// import { RemoveController } from "@/controller/remove.controller";
import { TemplateController } from "@/controller/template.controller";

export class MainModule {
  public readonly nodeService: NodeInstance = nodeService;
  public readonly commandService: CommandInstance = commandService;
  getAll() {
    return [
      InitController,
      // RemoveController, // 暂时隐藏 remove 功能
      TemplateController,
    ];
  }
}
