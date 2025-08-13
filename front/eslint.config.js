import vue from 'eslint-plugin-vue'
import prettier from 'eslint-plugin-prettier'
import parser from 'vue-eslint-parser'

export default [
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      vue,
      prettier,
    },
    rules: {
      // ✅ 1. 禁止使用 route.params.id（你已設定成功）
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "MemberExpression[object.property.name='params'][object.object.name='route'][property.name='id']",
          message: '❌ 請勿使用 route.params.id，請改用 route.params.communityId',
        },
        // ✅ 2. 禁止從 localStorage 拿 user
        {
          selector:
            "CallExpression[callee.object.name='localStorage'][callee.property.name='getItem'] > Literal[value='user']",
          message: '❌ 請不要直接從 localStorage 取得 user，應改用 userStore 或 /users/me API',
        },
        // ✅ 5. 禁止 v-for="i in 1" 這種單項無意義迴圈
        {
          selector: "VAttribute[key.name.name='for'] > VExpressionContainer > Literal[value=1]",
          message: '⚠️ 避免使用 v-for="i in 1"，請確認是否為開發時殘留測試碼',
        },
      ],

      // ✅ 3. Prettier 格式整合
      'prettier/prettier': 'warn',

      // ✅ 4. vue 基本建議規則（可擴充）
      'vue/no-unused-vars': 'warn',
      'vue/no-unused-components': 'warn',
      'vue/no-mutating-props': 'warn',
    },
  },
]
