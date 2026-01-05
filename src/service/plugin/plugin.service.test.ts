import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ESLINT, HUSKY, PRETTIER, TS } from "@/const/plugin.const";
import { PluginService } from "./plugin.service";

describe("pluginService", () => {
  let testDir: string;
  let pluginService: PluginService;
  let originalCwd: string;

  beforeEach(() => {
    // 保存原始工作目录
    originalCwd = process.cwd();

    // 创建临时测试目录
    testDir = path.join(tmpdir(), `baize-plugin-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });

    // 切换到测试目录
    process.chdir(testDir);

    // 确保项目根目录的配置文件存在（用于 readProjectConfig）
    // PluginService 会从项目根目录读取配置文件
    // 这些文件应该已经存在于项目根目录中
  });

  afterEach(() => {
    // 恢复原始工作目录
    process.chdir(originalCwd);

    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("getAll", () => {
    it("应该返回所有插件的名称列表", () => {
      pluginService = new PluginService(false);
      const plugins = pluginService.getAll();

      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThan(0);
      expect(plugins).toContain(PRETTIER);
      expect(plugins).toContain(ESLINT);
      expect(plugins).toContain(TS);
      expect(plugins).toContain(HUSKY);
    });
  });

  describe("get", () => {
    it("应该返回所有插件配置", () => {
      pluginService = new PluginService(false);
      const plugins = pluginService.get();

      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThan(0);

      // 检查每个插件的基本结构
      plugins.forEach((plugin) => {
        expect(plugin).toHaveProperty("name");
        expect(plugin).toHaveProperty("dev");
        expect(typeof plugin.name).toBe("string");
        expect(typeof plugin.dev).toBe("boolean");
      });
    });

    it("应该包含 Prettier 插件", () => {
      pluginService = new PluginService(false);
      const plugins = pluginService.get();
      const prettierPlugin = plugins.find((p) => p.name === PRETTIER);

      expect(prettierPlugin).toBeDefined();
      expect(prettierPlugin?.dev).toBe(true);
      expect(prettierPlugin?.config).toBeDefined();
      expect(prettierPlugin?.pkgInject).toBeDefined();
      expect(prettierPlugin?.pkgInject?.devDependencies).toHaveProperty(
        "prettier",
      );
      expect(prettierPlugin?.pkgInject?.scripts).toHaveProperty("format");
    });

    it("应该包含 ESLint 插件", () => {
      pluginService = new PluginService(false);
      const plugins = pluginService.get();
      const eslintPlugin = plugins.find((p) => p.name === ESLINT);

      expect(eslintPlugin).toBeDefined();
      expect(eslintPlugin?.dev).toBe(true);
      expect(eslintPlugin?.config).toBeDefined();
      expect(eslintPlugin?.pkgInject).toBeDefined();
      expect(eslintPlugin?.pkgInject?.devDependencies).toHaveProperty("eslint");
      expect(eslintPlugin?.pkgInject?.scripts).toHaveProperty("lint");
    });

    it("应该包含 TypeScript 插件", () => {
      pluginService = new PluginService(false);
      const plugins = pluginService.get();
      const tsPlugin = plugins.find((p) => p.name === TS);

      expect(tsPlugin).toBeDefined();
      expect(tsPlugin?.dev).toBe(true);
      expect(tsPlugin?.config).toBeDefined();
      expect(tsPlugin?.pkgInject).toBeDefined();
      expect(tsPlugin?.pkgInject?.devDependencies).toHaveProperty("typescript");
      expect(tsPlugin?.pkgInject?.scripts).toHaveProperty("typecheck");
    });

    it("应该包含 Husky 插件", () => {
      pluginService = new PluginService(false);
      const plugins = pluginService.get();
      const huskyPlugin = plugins.find((p) => p.name === HUSKY);

      expect(huskyPlugin).toBeDefined();
      expect(huskyPlugin?.dev).toBe(true);
      expect(huskyPlugin?.config).toBeDefined();
      expect(huskyPlugin?.pkgInject).toBeDefined();
      expect(huskyPlugin?.pkgInject?.devDependencies).toHaveProperty("husky");
      expect(huskyPlugin?.pkgInject?.devDependencies).toHaveProperty(
        "lint-staged",
      );
    });

    it("应该检测已存在的配置文件", () => {
      // 创建已存在的 prettier 配置文件
      const prettierConfig = JSON.stringify({ semi: false, singleQuote: true });
      fs.writeFileSync(path.join(testDir, ".prettierrc"), prettierConfig);

      pluginService = new PluginService(false);
      const plugins = pluginService.get();
      const prettierPlugin = plugins.find((p) => p.name === PRETTIER);

      expect(prettierPlugin).toBeDefined();
      // 应该使用已存在的配置文件
      if (
        prettierPlugin?.config &&
        typeof prettierPlugin.config === "object" &&
        "file" in prettierPlugin.config
      ) {
        expect(prettierPlugin.config.file).toBe(".prettierrc");
      }
    });

    it("应该检测已存在的 ESLint 配置文件", () => {
      // 创建已存在的 eslint 配置文件
      const eslintConfig = "export default []";
      fs.writeFileSync(path.join(testDir, "eslint.config.js"), eslintConfig);

      pluginService = new PluginService(false);
      const plugins = pluginService.get();
      const eslintPlugin = plugins.find((p) => p.name === ESLINT);

      expect(eslintPlugin).toBeDefined();
      // 应该使用已存在的配置文件
      if (
        eslintPlugin?.config &&
        typeof eslintPlugin.config === "object" &&
        "file" in eslintPlugin.config
      ) {
        expect(eslintPlugin.config.file).toBe("eslint.config.js");
      }
    });

    it("应该检测已存在的 TypeScript 配置文件", () => {
      // 创建已存在的 tsconfig.json
      const tsConfig = JSON.stringify({
        compilerOptions: { target: "ES2020" },
      });
      fs.writeFileSync(path.join(testDir, "tsconfig.json"), tsConfig);

      pluginService = new PluginService(false);
      const plugins = pluginService.get();
      const tsPlugin = plugins.find((p) => p.name === TS);

      expect(tsPlugin).toBeDefined();
      // 应该使用已存在的配置文件
      if (
        tsPlugin?.config &&
        typeof tsPlugin.config === "object" &&
        "file" in tsPlugin.config
      ) {
        expect(tsPlugin.config.file).toBe("tsconfig.json");
      }
    });

    it("应该检测 .husky 目录", () => {
      // 创建 .husky 目录
      const huskyDir = path.join(testDir, ".husky");
      fs.mkdirSync(huskyDir, { recursive: true });

      pluginService = new PluginService(false);
      const plugins = pluginService.get();
      const huskyPlugin = plugins.find((p) => p.name === HUSKY);

      expect(huskyPlugin).toBeDefined();
    });
  });

  describe("配置文件检测", () => {
    it("应该支持多种 Prettier 配置文件格式", () => {
      const configs = [
        ".prettierrc",
        ".prettierrc.json",
        ".prettierrc.js",
        "prettier.config.js",
      ];

      configs.forEach((configFile) => {
        const testConfigDir = path.join(
          tmpdir(),
          `baize-prettier-test-${Date.now()}`,
        );
        fs.mkdirSync(testConfigDir, { recursive: true });
        process.chdir(testConfigDir);

        fs.writeFileSync(path.join(testConfigDir, configFile), "{}");

        pluginService = new PluginService(false);
        const plugins = pluginService.get();
        const prettierPlugin = plugins.find((p) => p.name === PRETTIER);

        expect(prettierPlugin).toBeDefined();

        process.chdir(originalCwd);
        fs.rmSync(testConfigDir, { recursive: true, force: true });
      });
    });

    it("应该支持多种 ESLint 配置文件格式", () => {
      const configs = [".eslintrc.json", ".eslintrc.js", "eslint.config.js"];

      configs.forEach((configFile) => {
        const testConfigDir = path.join(
          tmpdir(),
          `baize-eslint-test-${Date.now()}`,
        );
        fs.mkdirSync(testConfigDir, { recursive: true });
        process.chdir(testConfigDir);

        const content = configFile.includes(".js") ? "export default []" : "{}";
        fs.writeFileSync(path.join(testConfigDir, configFile), content);

        pluginService = new PluginService(false);
        const plugins = pluginService.get();
        const eslintPlugin = plugins.find((p) => p.name === ESLINT);

        expect(eslintPlugin).toBeDefined();

        process.chdir(originalCwd);
        fs.rmSync(testConfigDir, { recursive: true, force: true });
      });
    });
  });
});
