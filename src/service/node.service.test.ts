import { describe, expect, it } from "vitest";
import { nodeService } from "./node.service";

describe("nodeService", () => {
  describe("versions", () => {
    it("应该正确解析 Node.js 版本", () => {
      expect(nodeService.versions).toHaveProperty("preVersion");
      expect(nodeService.versions).toHaveProperty("fullVersion");
      expect(typeof nodeService.versions.preVersion).toBe("number");
      expect(typeof nodeService.versions.fullVersion).toBe("string");
      expect(nodeService.versions.fullVersion).toMatch(/^v\d+\.\d+\.\d+$/);
    });

    it("preVersion 应该是主版本号", () => {
      const majorVersion = Number(
        process.version.split(".")[0].replace("v", ""),
      );
      expect(nodeService.versions.preVersion).toBe(majorVersion);
    });
  });

  describe("root", () => {
    it("应该正确设置项目根目录", () => {
      expect(nodeService.root).toBeTruthy();
      expect(typeof nodeService.root).toBe("string");
    });
  });

  describe("dirname", () => {
    it("应该正确设置目录名", () => {
      expect(nodeService.dirname).toBeTruthy();
      expect(typeof nodeService.dirname).toBe("string");
    });
  });
});
