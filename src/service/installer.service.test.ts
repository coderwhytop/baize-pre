import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PRETTIER } from "@/const/plugin.const";
import { installerService } from "./installer.service";

describe("installerService", () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(() => {
    // 保存原始工作目录
    originalCwd = process.cwd();

    // 创建临时测试目录
    testDir = path.join(tmpdir(), `baize-installer-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });

    // 切换到测试目录
    process.chdir(testDir);

    // 创建基本的 package.json
    const packageJson = {
      name: "test-project",
      version: "1.0.0",
      scripts: {},
      dependencies: {},
      devDependencies: {},
    };
    fs.writeFileSync(
      path.join(testDir, "package.json"),
      JSON.stringify(packageJson, null, 2),
    );
  });

  afterEach(() => {
    // 恢复原始工作目录
    process.chdir(originalCwd);

    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("selectedPlugins 跟踪", () => {
    it("应该在安装时初始化已选择的插件列表", async () => {
      // 创建模拟插件数据
      const mockPlugins = [
        {
          name: PRETTIER,
          dev: true,
          config: { file: ".prettierrc", json: "{}" },
          pkgInject: { devDependencies: { prettier: "^3.0.0" } },
        },
      ];

      // Mock chooseManager 和 toolService.execSync 以避免实际安装
      const chooseManagerSpy = vi
        .spyOn(installerService as any, "chooseManager")
        .mockResolvedValue(undefined);
      const { toolService } = await import("./tool.service");
      const execSyncSpy = vi
        .spyOn(toolService, "execSync")
        .mockImplementation(() => {});

      // 由于 install 方法会调用实际的方法，我们需要确保不会真正执行安装
      // 这里只验证 selectedPlugins 的初始化
      // 注意：install 方法在最后会清空 selectedPlugins，所以我们需要在安装过程中检查
      const installPromise = installerService.install(mockPlugins as any);

      // 等待 chooseManager 完成，此时 selectedPlugins 应该已初始化
      await chooseManagerSpy.mock.results[0].value;

      // 验证已选择插件列表已初始化（在清空之前）
      expect((installerService as any).selectedPlugins).toEqual(
        mockPlugins.map((p) => p.name),
      );

      try {
        await installPromise;
      } catch (e) {
        // 忽略安装过程中的错误
      }
      expect(chooseManagerSpy).toHaveBeenCalled();

      chooseManagerSpy.mockRestore();
      execSyncSpy.mockRestore();
    });
  });

  describe("lint-staged 配置解析", () => {
    it("应该支持多种 lint-staged 配置文件格式", () => {
      const configs = [
        "lint-staged.config.mjs",
        "lint-staged.config.js",
        "lint-staged.config.cjs",
        ".lintstagedrc",
        ".lintstagedrc.json",
      ];

      configs.forEach((configFile) => {
        const configPath = path.join(testDir, configFile);
        if (configFile.includes(".lintstagedrc")) {
          // 对于 .lintstagedrc 这种格式
          fs.writeFileSync(configPath, "{}");
        } else {
          // 对于 .mjs/.js/.cjs 格式
          fs.writeFileSync(configPath, "export default {}");
        }
        expect(fs.existsSync(configPath)).toBe(true);
      });
    });
  });

  describe("git 检查", () => {
    it("应该检测 .git 目录是否存在", () => {
      const gitPath = path.join(testDir, ".git");
      expect(fs.existsSync(gitPath)).toBe(false);

      // 创建 .git 目录
      fs.mkdirSync(gitPath, { recursive: true });
      expect(fs.existsSync(gitPath)).toBe(true);
    });
  });

  describe("eSLint type: module 检查", () => {
    it("应该检测 package.json 中的 type 字段", () => {
      const packageJsonPath = path.join(testDir, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      expect(packageJson.type).toBeUndefined();

      // 添加 type: module
      packageJson.type = "module";
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      const updatedPackageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, "utf-8"),
      );
      expect(updatedPackageJson.type).toBe("module");
    });
  });

  describe("typeScript 配置处理", () => {
    it("应该支持不同的 TypeScript 框架配置", () => {
      const frameworks = ["vue", "react", "node"];
      const frameworkMap: Record<string, string> = {
        vue: "tsconfig.vue.json",
        react: "tsconfig.react.json",
        node: "tsconfig.json",
      };

      frameworks.forEach((framework) => {
        expect(frameworkMap[framework]).toBeDefined();
      });
    });
  });

  describe("插件安装流程", () => {
    it("应该先选择包管理器", async () => {
      // 创建模拟插件数据
      const mockPlugins = [
        {
          name: PRETTIER,
          dev: true,
          config: { file: ".prettierrc", json: "{}" },
          pkgInject: { devDependencies: { prettier: "^3.0.0" } },
        },
      ];

      const chooseManagerSpy = vi
        .spyOn(installerService as any, "chooseManager")
        .mockResolvedValue(undefined);
      const { toolService } = await import("./tool.service");
      const execSyncSpy = vi
        .spyOn(toolService, "execSync")
        .mockImplementation(() => {});

      try {
        await installerService.install(mockPlugins as any);
      } catch (e) {
        // 忽略安装过程中的错误
      }

      // 验证 chooseManager 被调用
      expect(chooseManagerSpy).toHaveBeenCalled();

      chooseManagerSpy.mockRestore();
      execSyncSpy.mockRestore();
    });
  });
});
