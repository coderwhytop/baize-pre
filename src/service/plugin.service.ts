import type { PluginInstance } from "@/types/plugin.interface";
import type { TYPE_PLUGIN_ITEM } from "@/types/plugin.types";
import path from "node:path";
import fsExtra from "fs-extra";
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
          `import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: false,
  react: false,
  node: true,
  ignores: [
    'dist/**',
    'coverage/**',
    'scripts/**',
  ],
  rules: {
    // 允许 console.log
    'no-console': 'off',
    // 允许使用 process 全局变量
    'node/prefer-global/process': 'off',
    // 允许使用 Object.prototype.hasOwnProperty
    'no-prototype-builtins': 'off',
    // 允许使用 new 的副作用
    'no-new': 'off',
    // 关闭未使用变量检查
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-vars': 'off',
    // 允许类型定义使用 type 而不是 interface
    'ts/consistent-type-definitions': 'off',
    // 允许方法签名使用简写形式
    'ts/method-signature-style': 'off',
    // 允许使用 Object 而不是 object
    'ts/no-wrapper-object-types': 'off',
    // 允许使用 const assertion
    'ts/prefer-as-const': 'off',
  },
})`,
      },
      pkgInject: {
        devDependencies: {
          eslint: "^8.42.0",
          "@antfu/eslint-config": "^5.4.1",
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
          json: "npx lint-staged\n",
        },
        {
          file: "lint-staged.config.mjs",
          json: `export default {
  '*.{js,ts,tsx,jsx,vue}': ['npx eslint --fix', 'npx prettier --write'],
  '*.{json,md,yml,yaml}': ['npx prettier --write'],
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
