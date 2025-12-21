import path from "path";
import { log } from "./utils/logger.js";
import {
  exists,
  findFiles,
  ensureDir,
  removeDir,
  move,
  readDir,
  isDirectory,
} from "./utils/fs-utils.js";
import { exec, execSilent } from "./utils/exec-utils.js";

log.section("AGI Translation Project Setup");

// Create project directory if it doesn't exist
ensureDir("project");

// Find ZIP file in project/
const zipFiles = findFiles("project", /\.zip$/);

if (zipFiles.length === 0) {
  log.error("No ZIP file found in project/ directory");
  log.newline();
  log.info(
    "Please add your game files as a ZIP archive to the project/ directory.",
  );
  log.info("See project/README.md for instructions.");
  process.exit(1);
}

const zipFile = zipFiles[0];
log.success(`Found game archive: ${path.basename(zipFile)}`);
log.newline();

// Clean up existing directories
log.emoji("🧹", "Cleaning up old files...");
removeDir("project/orig");
removeDir("project/src");
removeDir("project/build");

// Extract ZIP to project/orig
log.emoji("📦", "Extracting game files...");
ensureDir("project/orig");
execSilent(`unzip -q "${zipFile}" -d project/orig`);

// Verify extraction
if (!exists("project/orig") || readDir("project/orig").length === 0) {
  log.error("Failed to extract ZIP file");
  process.exit(1);
}

// Check if files are in a subdirectory and move them up if needed
const origContents = readDir("project/orig");
const subdirs = origContents.filter((item) =>
  isDirectory(path.join("project/orig", item)),
);
const files = origContents.filter(
  (item) => !isDirectory(path.join("project/orig", item)),
);

if (subdirs.length === 1 && files.length === 0) {
  const subdir = subdirs[0];
  log.emoji("📁", "Moving files from subdirectory to root...");

  const subdirPath = path.join("project/orig", subdir);
  const subdirContents = readDir(subdirPath);

  for (const item of subdirContents) {
    move(path.join(subdirPath, item), path.join("project/orig", item));
  }

  removeDir(subdirPath);
}

log.success("Extracted to project/orig/");
log.newline();

// Run common AGI setup
exec("vite-node scripts/setup-agi.ts project");

log.emoji("✅", "Setup complete!");
