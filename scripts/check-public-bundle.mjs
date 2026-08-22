import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const forbiddenTerms = [
  "SCOUT",
  "AUDITOR",
  "FARMER",
  "HARVESTER",
  "TREASURY",
  "LARI Orchestrator",
  "Policy Engine",
  "Signer Service",
];

const textExtensions = new Set([".css", ".html", ".js", ".json", ".map", ".txt"]);

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else if (textExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const matches = [];
const distPath = fileURLToPath(new URL("../dist", import.meta.url));
for (const path of await filesIn(distPath)) {
  const content = await readFile(path, "utf8");
  for (const term of forbiddenTerms) {
    if (content.toLocaleLowerCase("en").includes(term.toLocaleLowerCase("en"))) {
      matches.push(`${term} in ${path}`);
    }
  }
}

if (matches.length) {
  console.error("Private operational concepts were found in the public bundle:");
  for (const match of matches) console.error(`- ${match}`);
  process.exit(1);
}

console.log("Public bundle boundary check passed.");
