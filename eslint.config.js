// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        extends: [eslint.configs.recommended],
        files: ["**/*{.js,.ts}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
        },
    },
    {
        extends: [...tseslint.configs.recommendedTypeChecked],
        files: ["**/*.ts"],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                { varsIgnorePattern: "^_" },
            ],
        },
    },
    {
        ignores: ["bundles"],
    },
);
