import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PackageService } from "./package.service";

describe("packageService", () => {
  let testDir: string;
  let packageService: PackageService;
  let originalCwd: string;

  beforeEach(() => {
    // 保存原始工作目录
    originalCwd = process.cwd();

    // 创建临时测试目录
    testDir = path.join(tmpdir(), `baize-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });

    // 切换到测试目录
    process.chdir(testDir);
  });

  afterEach(() => {
    // 恢复原始工作目录
    process.chdir(originalCwd);

    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("get", () => {
    it("应该返回默认信息当 package.json 不存在时", () => {
      packageService = new PackageService(true);
      const info = packageService.get();

      expect(info).toHaveProperty("scripts");
      expect(info).toHaveProperty("devDependencies");
      expect(info).toHaveProperty("dependencies");
      expect(fs.existsSync(path.join(testDir, "package.json"))).toBe(true);
    });

    it("应该正确读取已存在的 package.json", () => {
      const packageJson = {
        name: "test-package",
        version: "1.0.0",
        scripts: { test: "vitest" },
        dependencies: { chalk: "^4.0.0" },
        devDependencies: { vitest: "^2.0.0" },
      };

      fs.writeFileSync(
        path.join(testDir, "package.json"),
        JSON.stringify(packageJson, null, 2),
      );

      packageService = new PackageService(true);
      const info = packageService.get();

      expect(info.name).toBe("test-package");
      expect(info.version).toBe("1.0.0");
      expect(info.scripts).toEqual(packageJson.scripts);
      expect(info.dependencies).toEqual(packageJson.dependencies);
      expect(info.devDependencies).toEqual(packageJson.devDependencies);
    });

    it("应该处理无效的 JSON", () => {
      fs.writeFileSync(
        path.join(testDir, "package.json"),
        "invalid json content",
      );

      packageService = new PackageService(true);
      const info = packageService.get();

      expect(info).toHaveProperty("scripts");
      expect(info).toHaveProperty("devDependencies");
      expect(info).toHaveProperty("dependencies");
    });
  });

  describe("update", () => {
    beforeEach(() => {
      const packageJson = {
        name: "test",
        scripts: { test: "vitest" },
        dependencies: {},
        devDependencies: {},
      };
      fs.writeFileSync(
        path.join(testDir, "package.json"),
        JSON.stringify(packageJson, null, 2),
      );
      packageService = new PackageService(true);
    });

    it("应该正确更新 scripts", () => {
      packageService.update("scripts", { build: "rollup -c" });

      const info = packageService.get();
      expect(info.scripts).toHaveProperty("test");
      expect(info.scripts).toHaveProperty("build");
      expect(info.scripts.build).toBe("rollup -c");
    });

    it("应该正确合并 dependencies", () => {
      packageService.update("dependencies", { chalk: "^4.0.0" });
      packageService.update("dependencies", { "fs-extra": "^11.0.0" });

      const info = packageService.get();
      expect(info.dependencies).toHaveProperty("chalk");
      expect(info.dependencies).toHaveProperty("fs-extra");
    });

    it("应该正确合并 devDependencies", () => {
      packageService.update("devDependencies", { vitest: "^2.0.0" });
      packageService.update("devDependencies", { typescript: "^5.0.0" });

      const info = packageService.get();
      expect(info.devDependencies).toHaveProperty("vitest");
      expect(info.devDependencies).toHaveProperty("typescript");
    });

    it("应该正确更新其他字段", () => {
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      packageService.update("name", "new-name");
      // eslint-disable-next-line ts/ban-ts-comment
      // @ts-expect-error
      packageService.update("version", "2.0.0");

      const info = packageService.get();
      expect(info.name).toBe("new-name");
      expect(info.version).toBe("2.0.0");
    });
  });

  describe("remove", () => {
    beforeEach(() => {
      const packageJson = {
        name: "test",
        version: "1.0.0",
        scripts: { test: "vitest", build: "rollup" },
        dependencies: { chalk: "^4.0.0" },
        devDependencies: {},
      };
      fs.writeFileSync(
        path.join(testDir, "package.json"),
        JSON.stringify(packageJson, null, 2),
      );
      packageService = new PackageService(true);
    });

    it("应该正确删除 scripts 中的键", () => {
      packageService.remove("test", true);

      const info = packageService.get();
      expect(info.scripts).not.toHaveProperty("test");
      expect(info.scripts).toHaveProperty("build");
    });

    it("应该正确删除其他字段", () => {
      packageService.remove("version", false);

      const info = packageService.get();
      expect(info).not.toHaveProperty("version");
      expect(info).toHaveProperty("name");
    });

    it("应该抛出错误当键不存在时", () => {
      expect(() => {
        packageService.remove("nonexistent", false);
      }).toThrow();

      expect(() => {
        packageService.remove("nonexistent", true);
      }).toThrow();
    });
  });
});
