import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Run an ES module snippet in a fresh Node process and parse the JSON its last
 * stdout line prints.
 *
 * Some modules (`lib/rateLimit.js`, `lib/env.js`) read `process.env` at import
 * time, so a value under test can only be exercised by starting a new process
 * with that environment. `env` is merged over the current environment.
 *
 * Lives outside `test/` because `node --test` treats every file under `test/`
 * as a test file.
 */
export function runInFreshProcess(env, script) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  return JSON.parse(out.trim().split("\n").pop());
}
