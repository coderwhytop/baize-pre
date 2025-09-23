import fsExtra from "fs-extra";
import path from "path";
import { PluginInstance } from "@/instance/plugin.instance";
import { TYPE_PLUGIN_ITEM } from "@/type/plugin.type";
import { nodeService } from "@/service/node.service";
import { COMMITLINT, ESLINT, HUSKY, PRETTIER, TS } from "@/const/plugin.const";

export class PluginService implements PluginInstance {
  public readonly normalKey = "installs";
  private readConfig(relativePath: string): string {
    const full = path.join(nodeService.root, relativePath);
    if (!fsExtra.existsSync(full)) return "";
    return fsExtra.readFileSync(full, "utf-8");
  }
  private readConfigFirst(candidates: string[]): {
    filename: string | null;
    content: string;
  } {
    for (const name of candidates) {
      const content = this.readConfig(name);
      if (content) return { filename: name, content };
    }
    return { filename: null, content: "" };
  }

  // 提供内置插件定义，直接从项目根目录读取需要的配置文件
  private getBuiltinPlugins(): TYPE_PLUGIN_ITEM[] {
    const prettierTpl = this.readConfigFirst([
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

    const tsTpl = this.readConfigFirst(["tsconfig.json"]);
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
      this.readConfig("commitlint.config.cjs") ||
      this.readConfig("commitlint.config.js") ||
      "module.exports = {extends: ['@commitlint/config-conventional']};\n";
    const lintStagedConfig =
      this.readConfig("lint-staged.config.mjs") ||
      this.readConfig("lint-staged.config.js") ||
      "export default { '**/*.{js,ts,tsx,jsx,css,scss,md,json}': 'prettier --write' }\n";

    // ESLint: 优先读取项目根目录下的配置文件，按命名优先级选择
    const eslintTpl = this.readConfigFirst([
      "eslint.config.js",
      "eslint.config.cjs",
      "eslint.js",
      "eslint.cjs",
      ".eslintrc.js",
      ".eslintrc.cjs",
      ".eslintrc.json",
    ]);
    const eslintFile = eslintTpl.filename;
    const eslintContent = eslintTpl.content;

    // 始终提供所有插件，不管配置文件是否存在
    const hasPrettier = true; // 始终提供 prettier
    const hasTs = true; // 始终提供 typescript
    const hasCommitlint = Boolean(
      this.readConfig("commitlint.config.cjs") ||
        this.readConfig("commitlint.config.js")
    );
    const hasLintStaged = Boolean(
      this.readConfig("lint-staged.config.mjs") ||
        this.readConfig("lint-staged.config.js")
    );
    const hasEslint = true; // 始终提供 eslint

    const plugins: TYPE_PLUGIN_ITEM[] = [];

    if (hasPrettier) {
      plugins.push({
        name: PRETTIER,
        dev: true,
        config: { file: prettierTpl.filename || ".prettierrc", json: prettierRc },
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
        config: { file: tsTpl.filename || "tsconfig.json", json: tsconfig },
        pkgInject: {
          devDependencies: { typescript: "^5.5.3" },
          scripts: { typecheck: "tsc -p tsconfig.json --noEmit" },
        },
      });
    }

    if (hasEslint) {
      plugins.push({
        name: ESLINT,
        dev: true,
        config: { file: eslintFile || "eslint.config.js", json: eslintContent },
        pkgInject: {
          devDependencies: {
            eslint: "^8.42.0",
            "@eslint/js": "^9.0.0",
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
