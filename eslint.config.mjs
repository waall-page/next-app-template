import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // UIコンポーネントの Presenter 純化ルール (過剰な ?. や ?? の抑止)
  {
    files: ["components/**/*.tsx", "app/**/*Client.tsx"],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "ChainExpression",
          message: "UIコンポーネント内で `?.` が多用されていないか確認してください。サーバー（RSC）または ViewModel 側で確定できないか検討してください。"
        },
        {
          selector: "LogicalExpression[operator='??']",
          message: "UIコンポーネント内で `??` によるデフォルト補完を行っていませんか？ データの確定は上位レイヤー（RSC/ViewModel）で行ってください。"
        }
      ]
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);


export default eslintConfig;
