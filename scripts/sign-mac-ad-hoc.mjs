import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

export default async function signMacAdHoc(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appName = readdirSync(context.appOutDir).find((entry) => entry.endsWith(".app"));
  if (!appName) {
    throw new Error(`macOS app bundle was not found in ${context.appOutDir}`);
  }

  const appPath = join(context.appOutDir, appName);
  execFileSync("xattr", ["-cr", appPath], {
    stdio: "inherit"
  });
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", "--timestamp=none", appPath], {
    stdio: "inherit"
  });
}
