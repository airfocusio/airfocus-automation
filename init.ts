import { Command } from "commander";
import fs from "fs/promises";
import path from "path";

import packageJson from "./package.json";

export interface RenderTemplateOpts {
  name: string;
}

export async function renderTemplate(options: RenderTemplateOpts) {
  const ignores = [".git", "node_modules"];
  const replacements: { [key: string]: string } = {
    "airfocus-automation": options.name,
  };

  const sourceNames = await fs.readdir(__dirname, { recursive: true });
  const files = sourceNames
    .filter(
      (sourceName) => !ignores.some((ignore) => sourceName.startsWith(ignore)),
    )
    .map((sourceName) => path.join(__dirname, sourceName));

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const stat = await fs.stat(file);
    if (stat.isFile()) {
      const template = await fs.readFile(file, "utf-8");
      const rendered = Object.keys(replacements).reduce(
        (str, key) => str.replace(new RegExp(key, "g"), replacements[key]),
        template,
      );
      await fs.writeFile(file, rendered, "utf-8");
    }
  }
}

export function run() {
  const program = new Command(packageJson.name)
    .version(packageJson.version)
    .requiredOption("-n, --name <string>")
    .action((opts: RenderTemplateOpts) => renderTemplate(opts));

  return program.parseAsync();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
