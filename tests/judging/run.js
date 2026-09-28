#!/usr/bin/env node
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const testFiles = [
  resolve(__dirname, "scoring.test.ts"),
  resolve(__dirname, "normalization.test.ts"),
  resolve(__dirname, "assignment.test.ts"),
  resolve(__dirname, "export.test.ts"),
];

console.log("=== Running Judging Subsystem Test Suite (Tier 2) ===");
console.log(`Node version: ${process.version}`);
console.log(`Running ${testFiles.length} test files offline...`);

const child = spawn(
  process.execPath,
  ["--experimental-strip-types", "--test", ...testFiles],
  { stdio: "inherit" }
);

child.on("exit", (code) => {
  if (code === 0) {
    console.log("\n All 20 judging subsystem tests PASSED successfully!");
  } else {
    console.error(`\n Tests failed with exit code ${code}`);
  }
  process.exit(code ?? 1);
});
