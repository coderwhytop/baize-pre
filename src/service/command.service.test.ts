import { describe, expect, it } from "vitest";
import { commandService } from "./command.service";

describe("commandService", () => {
  describe("main", () => {
    it("应该有主命令名称", () => {
      expect(commandService.main).toBeTruthy();
      expect(typeof commandService.main).toBe("string");
      expect(commandService.main).toBe("baize");
    });
  });

  describe("subs", () => {
    it("应该包含 init 命令", () => {
      expect(commandService.subs).toHaveProperty("init");
      expect(commandService.subs.init).toHaveProperty("alias");
      expect(commandService.subs.init).toHaveProperty("description");
      expect(commandService.subs.init).toHaveProperty("examples");
      expect(Array.isArray(commandService.subs.init.examples)).toBe(true);
    });

    it("应该包含 template 命令", () => {
      expect(commandService.subs).toHaveProperty("template");
      expect(commandService.subs.template).toHaveProperty("alias");
      expect(commandService.subs.template).toHaveProperty("description");
      expect(commandService.subs.template).toHaveProperty("examples");
      expect(Array.isArray(commandService.subs.template.examples)).toBe(true);
    });

    it("template 命令应该有别名 t", () => {
      expect(commandService.subs.template.alias).toBe("t");
    });

    it("命令描述应该是字符串", () => {
      expect(typeof commandService.subs.init.description).toBe("string");
      expect(typeof commandService.subs.template.description).toBe("string");
    });
  });
});
