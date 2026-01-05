import type { NodeInstance } from "@/types/interface/node.interface";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

class NodeService implements NodeInstance {
  public readonly filename: string;
  public readonly dirname: string;
  public readonly root: string;
  public readonly versions: {
    preVersion: number;
    fullVersion: string;
  };

  constructor() {
    this.filename = fileURLToPath(import.meta.url);
    this.dirname = path.dirname(this.filename);
    // 开发环境：文件在 src/service/node/ 下，需要向上两级到达 src/ 目录
    // 构建后：文件在 dist/cli.mjs，需要向上一级到达项目根目录
    // 通过检查 dirname 的 basename 来判断环境
    if (path.basename(this.dirname) === "dist") {
      // 构建后：在 dist/ 目录下，向上一级到项目根目录
      this.root = path.join(this.dirname, "..");
    } else {
      // 开发环境：在 src/service/node/ 下，向上两级到 src/ 目录
      this.root = path.join(this.dirname, "../..");
    }
    this.versions = {
      preVersion: Number(process.versions.node.split(".")[0]),
      fullVersion: process.version,
    };
  }
}

export const nodeService = new NodeService();
