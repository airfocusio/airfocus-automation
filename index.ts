import { Command } from "commander";
import fs from "fs/promises";
import path from "path";

import packageJson from "./package.json";

export interface RenderTemplateOpts {
  name: string;
  directory?: string;
  force?: boolean;
}

export async function renderTemplate(options: RenderTemplateOpts) {
  const ignores = ["node_modules"];
  const replacements: { [key: string]: string } = {
    name: options.name,
  };

  const target = path.resolve(options.directory || options.name);
  process.stdout.write(
    `Running ${packageJson.name} v${packageJson.version} to directory ${target}\n`,
  );
  if (options.force) {
    await fs.rm(target, { recursive: true }).catch(() => {});
  }
  await fs.mkdir(target);

  const source = path.resolve(__dirname, "template");
  const sourceNames = await fs.readdir(source, { recursive: true })
  const files = [
    {
      source: path.join(__dirname, 'README.md'),
      target: path.join(target, 'README.md'),
    },
    ...sourceNames.filter(sourceName => !ignores.some((ignore) => sourceName.startsWith(ignore))).map(sourceName => {
      return {
        source: path.join(source, sourceName),
        target: path.join(target, sourceName),
      }
    })
  ]

  for (let i = 0; i < files.length; i++) {
    const { source: sourceFile, target: targetFile } = files[i];
    const stat = await fs.stat(sourceFile);

    if (stat.isDirectory()) {
      await fs.mkdir(targetFile);
    } else if (stat.isFile()) {
      const template = await fs.readFile(sourceFile, "utf-8");
      const rendered = Object.keys(replacements).reduce(
        (str, key) =>
          str.replace(
            new RegExp("airfocus-automation-template-" + key, "g"),
            replacements[key],
          ),
        template,
      );
      await fs.writeFile(targetFile, rendered, "utf-8");
    }
  }
}

export function run() {
  const program = new Command(packageJson.name)
    .version(packageJson.version)
    .requiredOption("-n, --name <string>")
    .option("-d, --directory <string>")
    .option("-f, --force")
    .action((opts: RenderTemplateOpts) => renderTemplate(opts));

  return program.parseAsync();
}
