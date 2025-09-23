import fsExtra from "fs-extra";
import path from "path";
import { PluginInstance } from "@/instance/plugin.instance";
import { TYPE_PLUGIN_ITEM } from "@/type/plugin.type";
// import { nodeService } from "@/service/node.service";
import { ESLINT, HUSKY, PRETTIER, TS } from "@/const/plugin.const";

export class PluginService implements PluginInstance {
  public readonly normalKey = "installs";
  private readConfig(relativePath: string): string {
    const full = path.join(process.cwd(), relativePath);
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

  // 检测配置文件是否存在
  private detectConfigFiles() {
    const prettierFiles = [
      ".prettierrc",
      ".prettierrc.json",
      ".prettierrc.js",
      ".prettierrc.cjs",
      ".prettierrc.mjs",
      "prettier.config.js",
      "prettier.config.cjs",
      "prettier.config.mjs",
      "prettier.config.json",
    ];

    const eslintFiles = [
      ".eslintrc",
      ".eslintrc.json",
      ".eslintrc.js",
      ".eslintrc.cjs",
      ".eslintrc.mjs",
      "eslint.config.js",
      "eslint.config.cjs",
      "eslint.config.mjs",
      "eslint.js",
      "eslint.cjs",
    ];

    const tsFiles = ["tsconfig.json"];

    // const huskyFiles = [".husky"];

    return {
      prettier: this.readConfigFirst(prettierFiles),
      eslint: this.readConfigFirst(eslintFiles),
      typescript: this.readConfigFirst(tsFiles),
      husky: fsExtra.existsSync(path.join(process.cwd(), ".husky")),
    };
  }

  // 提供内置插件定义，支持配置文件检测和修改
  private getBuiltinPlugins(): TYPE_PLUGIN_ITEM[] {
    const configs = this.detectConfigFiles();

    const plugins: TYPE_PLUGIN_ITEM[] = [];

    // Prettier 插件
    plugins.push({
      name: PRETTIER,
      dev: true,
      config: {
        file: configs.prettier.filename || ".prettierrc",
        json:
          configs.prettier.content ||
          JSON.stringify(
            {
              singleQuote: true,
              semi: false,
              printWidth: 100,
              tabWidth: 2,
              trailingComma: "es5",
            },
            null,
            2
          ),
      },
      pkgInject: {
        devDependencies: { prettier: "^3.3.3" },
        scripts: { format: "prettier --write ." },
      },
    });

    // ESLint 插件
    plugins.push({
      name: ESLINT,
      dev: true,
      config: {
        file: configs.eslint.filename || "eslint.config.js",
        json:
          configs.eslint.content ||
          `import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn'
    }
  }
]`,
      },
      pkgInject: {
        devDependencies: {
          eslint: "^8.42.0",
          "@eslint/js": "^9.0.0",
          "@typescript-eslint/parser": "^6.0.0",
          "@typescript-eslint/eslint-plugin": "^6.0.0",
          "eslint-config-prettier": "^9.0.0",
          "eslint-plugin-prettier": "^5.0.0",
        },
        scripts: { lint: "eslint . --ext .ts,.tsx,.js --fix" },
      },
    });

    // TypeScript 插件
    plugins.push({
      name: TS,
      dev: true,
      config: {
        file: configs.typescript.filename || "tsconfig.json",
        json:
          configs.typescript.content ||
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
                allowSyntheticDefaultImports: true,
                resolveJsonModule: true,
              },
              include: ["src/**/*"],
              exclude: ["node_modules", "dist"],
            },
            null,
            2
          ),
      },
      pkgInject: {
        devDependencies: { typescript: "^5.5.3" },
        scripts: { typecheck: "tsc --noEmit" },
      },
    });

    // Husky 插件（需要检测 git）
    plugins.push({
      name: HUSKY,
      dev: true,
      config: [
        {
          file: ".husky/pre-commit",
          json: '#!/usr/bin/env sh\n. "$(dirname -- "$0")/_/husky.sh"\n\nnpx lint-staged\n',
        },
        {
          file: "lint-staged.config.mjs",
          json: `export default {
  '*.{js,ts,tsx,jsx,vue}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write']
}`,
        },
      ] as any,
      pkgInject: {
        devDependencies: {
          husky: "^9.1.1",
          "lint-staged": "^15.2.7",
        },
      },
    });

    return plugins;
  }

  constructor(_unused: boolean) {}

  getAll() {
    return this.get().map(item => item.name);
  }
  get(): TYPE_PLUGIN_ITEM[] {
    return this.getBuiltinPlugins();
  }
  reset() {}
  set(_unused: string, _unused2: object) {}
}
