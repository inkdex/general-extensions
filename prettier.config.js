// @ts-check

/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */
export default {
    printWidth: 80,
    tabWidth: 4,
    useTabs: false,
    semi: true,
    singleQuote: false,
    quoteProps: "as-needed",
    trailingComma: "all",
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: "always",
    endOfLine: "lf",
    embeddedLanguageFormatting: "auto",
    plugins: ["@ianvs/prettier-plugin-sort-imports"],
};
