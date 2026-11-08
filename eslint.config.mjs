export default [
  {
    files: ["frontend/src/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        requestAnimationFrame: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        URLSearchParams: "readonly",
        fetch: "readonly",
        IntersectionObserver: "readonly",
        localStorage: "readonly",
        location: "readonly",
        URL: "readonly",
        FormData: "readonly",
        Blob: "readonly",
        Event: "readonly",
        Image: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-undef": "error",
      "no-console": "warn",
      eqeqeq: "error",
      curly: ["error", "all"],
    },
  },
];
