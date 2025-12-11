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
    // 关闭大括号样式规则，让 Prettier 处理格式化
    'style/brace-style': 'off',
    // 修复 unicorn/prefer-node-protocol 兼容性问题
    'unicorn/prefer-node-protocol': 'off',
  },
})
