export default {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  // Native ESM (package.json "type": "module"); no Babel transform.
  transform: {},
  verbose: true,
  testTimeout: 15000
};
