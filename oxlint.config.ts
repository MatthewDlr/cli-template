import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "unicorn", "oxc", "node"],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  categories: {
    correctness: "error",
    suspicious: "warn",
    perf: "warn",
    pedantic: "off",
    style: "off",
  },
  env: {
    builtin: true,
  },
  rules: {
    /* Repository-specific */
    "no-console": "error", // All terminal output goes through src/utils/logger.ts
    "no-throw-literal": "error", // Errors are returned as neverthrow Results
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "bun",
            importNames: ["$"],
            message:
              "Do not import $ from bun directly. Use runCommand or runShellCommands from src/utils/shell.ts instead.",
          },
          {
            name: "node:util",
            importNames: ["parseArgs"],
            message:
              "Do not parse argv manually. Declare the route in src/router.ts so @bomb.sh/router validates the model.",
          },
          {
            name: "util",
            importNames: ["parseArgs"],
            message:
              "Do not parse argv manually. Declare the route in src/router.ts so @bomb.sh/router validates the model.",
          },
          {
            name: "@clack/prompts",
            importNames: ["spinner", "intro", "outro", "log"],
            message:
              "Do not import Clack primitives directly. Use the helpers from src/utils/logger.ts instead.",
          },
        ],
      },
    ],

    /* General */
    "no-unused-expressions": [
      "error",
      {
        allowShortCircuit: true,
        allowTernary: true,
      },
    ],

    /* Node */
    "node/no-path-concat": "error",

    /* Sequential awaits are the contract: shell commands stop on the first failure */
    "eslint/no-await-in-loop": "off",

    /* Unicorn */
    "unicorn/prefer-node-protocol": "error",
    "unicorn/no-process-exit": "error",
    "unicorn/prefer-ternary": "error",

    /* OXC */
    "oxc/bad-char-at-comparison": "error",
    "oxc/bad-object-literal-comparison": "error",
    "oxc/bad-replace-all-arg": "error",
    "oxc/const-comparisons": "error",
    "oxc/double-comparisons": "error",
    "oxc/erasing-op": "error",
    "oxc/missing-throw": "error",
    "oxc/no-barrel-file": "error",
    "oxc/no-const-enum": "error",
    "oxc/number-arg-out-of-range": "error",
    "oxc/only-used-in-recursion": "error",
    "oxc/uninvoked-array-callback": "error",

    /* TypeScript (type-aware) */
    "typescript/adjacent-overload-signatures": "error",
    "typescript/await-thenable": "error",
    "typescript/class-literal-property-style": "error",
    "typescript/consistent-generic-constructors": "error",
    "typescript/consistent-indexed-object-style": ["error", "record"],
    "typescript/consistent-type-assertions": [
      "error",
      {
        assertionStyle: "never",
      },
    ],
    "typescript/consistent-type-definitions": ["error", "type"],
    "typescript/consistent-type-exports": [
      "error",
      {
        fixMixedExportsWithInlineTypeSpecifier: true,
      },
    ],
    "typescript/consistent-type-imports": [
      "error",
      {
        fixStyle: "inline-type-imports",
      },
    ],
    "typescript/dot-notation": "error",
    "typescript/explicit-module-boundary-types": [
      "error",
      {
        allowHigherOrderFunctions: false,
      },
    ],
    "typescript/no-deprecated": "error",
    "typescript/no-duplicate-enum-values": "error",
    "typescript/no-duplicate-type-constituents": "error",
    "typescript/no-explicit-any": [
      "error",
      {
        fixToUnknown: true,
      },
    ],
    "typescript/no-extra-non-null-assertion": "error",
    "typescript/no-floating-promises": "error",
    "typescript/no-for-in-array": "error",
    "typescript/no-implied-eval": "error",
    "typescript/no-invalid-void-type": "error",
    "typescript/no-meaningless-void-operator": "error",
    "typescript/no-misused-new": "error",
    "typescript/no-misused-spread": "error",
    "typescript/no-non-null-asserted-optional-chain": "error",
    "typescript/no-non-null-assertion": "error", // Prefer optional chaining or explicit checks over `!`
    "typescript/no-redundant-type-constituents": "error",
    "typescript/no-this-alias": "error",
    "typescript/no-unnecessary-boolean-literal-compare": "error",
    "typescript/no-unnecessary-condition": "error",
    "typescript/no-unnecessary-qualifier": "error",
    "typescript/no-unnecessary-type-arguments": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/no-unnecessary-type-constraint": "error",
    "typescript/no-unsafe-declaration-merging": "error",
    "typescript/no-useless-default-assignment": "error",
    "typescript/no-useless-empty-export": "error",
    "typescript/no-wrapper-object-types": "error",
    "typescript/prefer-as-const": "error",
    "typescript/prefer-function-type": "error",

    /* JSDoc */
    "jsdoc/check-access": "error",
    "jsdoc/check-property-names": "error",
    "jsdoc/check-tag-names": [
      "error",
      {
        definedTags: [
          "abstract",
          "alpha",
          "author",
          "beta",
          "category",
          "class",
          "defaultValue",
          "deprecated",
          "document",
          "enum",
          "event",
          "eventProperty",
          "example",
          "expand",
          "experimental",
          "function",
          "group",
          "hidden",
          "hideconstructor",
          "ignore",
          "import",
          "include",
          "inheritDoc",
          "inline",
          "interface",
          "internal",
          "label",
          "license",
          "link",
          "mergeModuleWith",
          "module",
          "namespace",
          "overload",
          "override",
          "packageDocumentation",
          "param",
          "primaryExport",
          "private",
          "privateRemarks",
          "property",
          "protected",
          "public",
          "readonly",
          "remarks",
          "returns",
          "sealed",
          "see",
          "since",
          "sortStrategy",
          "summary",
          "template",
          "throws",
          "typeParam",
          "useDeclaredType",
          "virtual",
        ],
        typed: true,
      },
    ],
    "jsdoc/empty-tags": "error",
    "jsdoc/implements-on-classes": "error",
    "jsdoc/no-defaults": [
      "error",
      {
        noOptionalParamNames: true,
      },
    ],
    "jsdoc/require-param-description": "error",
    "jsdoc/require-property-description": "error",
    "jsdoc/require-property-name": "error",
    "jsdoc/require-returns": "error",
    "jsdoc/require-returns-description": "error",
    "jsdoc/require-yields": "error",
  },
  overrides: [
    {
      files: ["**/*.spec.ts"],
      rules: {
        "typescript/no-explicit-any": "off",
        "typescript/explicit-module-boundary-types": "off",
        "jsdoc/require-returns": "off",
        "jsdoc/require-returns-description": "off",
        "unicorn/consistent-function-scoping": "off", // Inline fixtures keep each test self-contained
      },
    },
    {
      files: ["src/utils/shell.ts", "src/utils/logger.ts", "src/types/**"],
      rules: {
        "no-restricted-imports": "off",
      },
    },
  ],
  ignorePatterns: ["dist/**", "node_modules/**", "out/**", "coverage/**", "*.config.js"],
});
