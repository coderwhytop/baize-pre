import fsExtra from "fs-extra";
import path from "path";
import { PluginInstance } from "@/instance/plugin.instance";
import { TYPE_PLUGIN_ITEM } from "@/type/plugin.type";
import { nodeService } from "@/service/node.service";
import { COMMITLINT, ESLINT, HUSKY, PRETTIER, TS } from "@/const/plugin.const";

export class PluginService implements PluginInstance {
  public readonly normalKey = "installs";
  private readTemplate(relativePath: string): string {
    const full = path.join(nodeService.root, "template", relativePath);
    if (!fsExtra.existsSync(full)) return "";
    return fsExtra.readFileSync(full, "utf-8");
  }
  private readTemplateFirst(candidates: string[]): {
    filename: string | null;
    content: string;
  } {
    for (const name of candidates) {
      const content = this.readTemplate(name);
      if (content) return { filename: name, content };
    }
    return { filename: null, content: "" };
  }

  // 提供内置插件定义，直接从 template 读取需要的配置文件
  private getBuiltinPlugins(): TYPE_PLUGIN_ITEM[] {
    const prettierTpl = this.readTemplateFirst([
      ".prettierrc",
      "prettier.config.mjs",
      "prettier.config.cjs",
      "prettier.config.js",
    ]);
    const prettierRc =
      prettierTpl.content ||
      JSON.stringify(
        {
          singleQuote: true,
          semi: false,
          printWidth: 100,
        },
        null,
        2
      );

    const tsTpl = this.readTemplateFirst(["tsconfig.json"]);
    const tsconfig =
      tsTpl.content ||
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            module: "ESNext",
            moduleResolution: "Node",
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          include: ["src"],
          exclude: ["node_modules", "dist"],
        },
        null,
        2
      );

    const huskyPreCommit =
      '#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n\nnpx lint-staged\n';
    const commitMsgHook =
      '#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n\nnpx --no-install commitlint --edit $1\n';

    const commitlintConfig =
      this.readTemplate("commitlint.config.js") ||
      "module.exports = {extends: ['@commitlint/config-conventional']};\n";
    const lintStagedConfig =
      this.readTemplate("lint-staged.config.mjs") ||
      "export default { '**/*.{js,ts,tsx,jsx,css,scss,md,json}': 'prettier --write' }\n";

    // ESLint: 优先读取 template 下的配置文件，按命名优先级选择
    const eslintTpl = this.readTemplateFirst([
      "eslint.js",
      "eslint.cjs",
      "eslint.config.js",
      "eslint.config.cjs",
      ".eslintrc.js",
      ".eslintrc.cjs",
      ".eslintrc.json",
    ]);
    const eslintFile = eslintTpl.filename;
    const eslintContent = eslintTpl.content;

    // 动态启用：仅当 template 中存在对应文件时，才注入该插件
    const hasPrettier = Boolean(prettierTpl.filename);
    const hasTs = Boolean(tsTpl.filename);
    const hasCommitlint = Boolean(this.readTemplate("commitlint.config.js"));
    const hasLintStaged = Boolean(this.readTemplate("lint-staged.config.mjs"));
    const hasEslint = Boolean(eslintFile);

    const plugins: TYPE_PLUGIN_ITEM[] = [];

    if (hasPrettier) {
      plugins.push({
        name: PRETTIER,
        dev: true,
        config: { file: prettierTpl.filename!, json: prettierRc },
        pkgInject: {
          devDependencies: { prettier: "^3.3.3" },
          scripts: { format: "prettier --write ." },
        },
      });
    }

    if (hasTs) {
      plugins.push({
        name: TS,
        dev: true,
        config: { file: tsTpl.filename!, json: tsconfig },
        pkgInject: {
          devDependencies: { typescript: "^5.5.3" },
          scripts: { typecheck: "tsc -p tsconfig.json --noEmit" },
        },
      });
    }

    if (hasEslint && eslintFile) {
      plugins.push({
        name: ESLINT,
        dev: true,
        config: { file: eslintFile, json: eslintContent },
        pkgInject: {
          devDependencies: {
            eslint: "^8.42.0",
            "@typescript-eslint/parser": "^6.0.0",
            "@typescript-eslint/eslint-plugin": "^6.0.0",
            "eslint-config-prettier": "^9.0.0",
            "eslint-plugin-prettier": "^5.0.0",
          },
          scripts: { lint: "eslint . --ext .ts,.tsx,.js" },
        },
      });
    }

    // 如果存在 lint-staged 或 commitlint 模板，则自动安装 husky 并写入对应 hook
    if (hasLintStaged || hasCommitlint) {
      const huskyConfigs: Array<{ file: string; json: string }> = [];
      if (hasLintStaged) {
        huskyConfigs.push({ file: ".husky/pre-commit", json: huskyPreCommit });
      }
      if (hasCommitlint) {
        huskyConfigs.push({ file: ".husky/commit-msg", json: commitMsgHook });
      }
      if (hasLintStaged) {
        huskyConfigs.push({
          file: "lint-staged.config.mjs",
          json: lintStagedConfig,
        });
      }

      plugins.push({
        name: HUSKY,
        dev: true,
        config: huskyConfigs as any,
        pkgInject: {
          devDependencies: {
            husky: "^9.1.1",
            ...(hasLintStaged ? { "lint-staged": "^15.2.7" } : {}),
          },
        },
      });
    }

    if (hasCommitlint) {
      plugins.push({
        name: COMMITLINT,
        dev: true,
        config: [
          { file: "commitlint.config.js", json: commitlintConfig },
        ] as any,
        pkgInject: {
          devDependencies: {
            "@commitlint/cli": "^19.4.0",
            "@commitlint/config-conventional": "^19.4.0",
          },
        },
      });
    }

    return plugins;
  }

  constructor(_: boolean) {}

  getAll() {
    return this.get().map(item => item.name);
  }
  get(): TYPE_PLUGIN_ITEM[] {
    return this.getBuiltinPlugins();
  }
  reset() {}
  set(_: string, __: object) {}
}
