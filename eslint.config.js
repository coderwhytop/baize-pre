import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  vue: false,
  react: false,
  node: true,
  ignores: [
    'dist/**',
    'coverage/**',
    'scripts/**',
    'template/**',
    'tsconfig*.json',
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
    // 关闭所有格式化相关规则，让 Prettier 完全控制格式化
    // style/ 规则（来自 @stylistic/eslint-plugin）
    'style/brace-style': 'off',
    'style/operator-linebreak': 'off',
    'style/wrap-iife': 'off',
    'style/wrap-regex': 'off',
    'style/implicit-arrow-linebreak': 'off',
    'style/comma-dangle': 'off',
    'style/indent': 'off',
    'style/quotes': 'off',
    'style/semi': 'off',
    // 关闭逗号相关规则，让 Prettier 处理尾随逗号
    'comma-dangle': 'off',
    '@typescript-eslint/comma-dangle': 'off',
    // 关闭 @antfu/eslint-config 特有的格式化规则
    'antfu/if-newline': 'off',
    'antfu/import-dedupe': 'off',
    'antfu/top-level-function': 'off',
    'antfu/curly': 'off',
    // 关闭 unicorn 插件中可能有兼容性问题的规则
    'unicorn/prefer-node-protocol': 'off',
    'unicorn/error-message': 'off', // 修复兼容性问题：context.sourceCode.isGlobalReference is not a function
    'unicorn/no-new-array': 'off', // 修复兼容性问题：sourceCode.getRange is not a function
    'unicorn/prefer-module': 'off',
    'unicorn/no-array-callback-reference': 'off',
    'unicorn/prefer-array-some': 'off',
    'unicorn/prefer-array-find': 'off',
  },
})
