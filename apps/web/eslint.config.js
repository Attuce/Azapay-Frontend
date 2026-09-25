import { nextJsConfig } from "@workspace/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Keep short guards concise while requiring braces for multiline bodies.
      curly: ["error", "multi-line"],
      "react-hooks/set-state-in-effect": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Read environment variables in src/server/config.ts and inject configuration through Effection context.",
        },
      ],
    },
  },
  {
    files: ["src/server/config.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    files: ["src/features/**/*.ts"],
    rules: {
      // Effection's useAbortSignal is an operation, not a React Hook.
      "react-hooks/rules-of-hooks": "off",
    },
  },
  {
    files: ["app/**/actions.ts"],
    rules: {
      // ADR 0009 permits boundary failures to reject a Next.js server action.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[object.name='process'][property.name='env']",
          message:
            "Read environment variables in src/server/config.ts and inject configuration through Effection context.",
        },
      ],
    },
  },
]
