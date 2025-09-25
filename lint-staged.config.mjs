export default {
  '*.{js,ts,tsx,jsx,vue}': ['npx eslint --fix', 'npx prettier --write'],
  '*.{json,md,yml,yaml}': ['npx prettier --write'],
}
