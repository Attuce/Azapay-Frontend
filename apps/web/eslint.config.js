import { nextJsConfig } from "@workspace/eslint-config/next-js"

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // The existing mock-auth pages update state in effects. Keep that
      // pre-existing warning visible until authentication is replaced.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]
