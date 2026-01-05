import type { CommandInstance } from "@/types/interface/command.interface";
import type { NodeInstance } from "@/types/interface/node.interface";
import { InitController } from "@/controller/init.controller";
import { TemplateController } from "@/controller/template.controller";
import { commandService } from "@/service/command/command.service";
import { nodeService } from "@/service/node/node.service";

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
