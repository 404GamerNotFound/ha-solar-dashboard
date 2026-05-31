import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const languages = ["en", "de", "es", "fr", "pl"];
const [key, ...values] = process.argv.slice(2);

function usage() {
  console.error("Usage: npm run i18n:add-key -- <key> <en> <de> <es> <fr> <pl>");
  process.exit(1);
}

if (!key || values.length !== languages.length) usage();

function readDictionary(language) {
  return JSON.parse(readFileSync(join(root, "i18n", `${language}.json`), "utf8"));
}

function writeDictionary(language, dictionary) {
  writeFileSync(join(root, "i18n", `${language}.json`), `${JSON.stringify(dictionary, null, 2)}\n`);
}

languages.forEach((language, index) => {
  const dictionary = readDictionary(language);
  if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
    throw new Error(`i18n/${language}.json already contains ${key}`);
  }
  dictionary[key] = values[index];
  writeDictionary(language, dictionary);
});

console.log(`Added ${key} to ${languages.map((language) => `i18n/${language}.json`).join(", ")}`);
