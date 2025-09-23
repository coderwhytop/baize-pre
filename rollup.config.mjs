import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "rollup-plugin-typescript2"
import copy from "rollup-plugin-copy"
import alias from "@rollup/plugin-alias"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default [
  {
    input: "src/main.module.ts",
    output: [
      {
        file: "dist/index.cjs",
        format: "cjs",
        sourcemap: false,
        inlineDynamicImports: true
      },
      {
        file: "dist/index.mjs",
        format: "esm",
        sourcemap: false,
        inlineDynamicImports: true
      }
    ],
    plugins: [
      alias({
        entries: [{ find: "@", replacement: path.resolve(__dirname, "./src") }]
      }),
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json", useTsconfigDeclarationDir: true }),
      copy({
        targets: [
          { src: "README.md", dest: "dist" }
        ]
      })
    ],
    external: [
      "inquirer",
      "commander",
      "chalk",
      "readline-sync",
      "fs-extra",
      "simple-git",
      "source-map-support",
      "fs",
      "path",
      "url"
    ]
  },
  {
    input: "src/main.ts",
    output: {
      file: "dist/cli.cjs",
      format: "cjs",
      sourcemap: false,
      inlineDynamicImports: true,
      banner: "#!/usr/bin/env node"
    },
    plugins: [
      alias({
        entries: [{ find: "@", replacement: path.resolve(__dirname, "./src") }]
      }),
      resolve(),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json", useTsconfigDeclarationDir: true })
    ],
    external: [
      "inquirer",
      "commander",
      "chalk",
      "readline-sync",
      "fs-extra",
      "simple-git",
      "source-map-support",
      "fs",
      "path",
      "url"
    ]
  }
]


