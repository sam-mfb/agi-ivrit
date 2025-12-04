# agi-ivrit

A project designed to make it easy to start with a legally acquired copy of an AGI game, prepare it for translation to Hebrew, translate it to Hebrew, and then recompile the translated game.

This project is heavily inspired by the following projects:

- [Segev Maskraky's AGIHebrew](https://github.com/SegMash/AGIHebrew)
- [adventurebrew team](https://github.com/adventurebrew/re-quest)

The key changes from those projects are:

- Typescript scripts
- Use of agikit-slim for CLI-based decompiling and compiling
- React based viewer for easy viewing and editing of translation jsons

---

## Overview of AGI Translation

The basic steps in translating an AGI game to Hebrew (or any language presumably) are:

| Step | Description |
|------|-------------|
| **1. Game Preparation** | Decompiling the original AGI files and converting all message strings to indexed references (e.g., `display(m1)` rather than `display("Hello, World")`) |
| **2. Text Extraction** | Extracting all user-facing English text for (a) in-game messages, (b) inventory objects, (c) view descriptions, and (d) command vocabulary. |
| **3. Translation** | Translating all text to Hebrew, including both the strings extracted in step 2, but also text that is represented visually in PIC or VIEW resources. |
| **4. Game Modifications** | Modifying game logic to account for RTL display and any other translation-required adjustments. For example, display() commands may need to be shifted to be right-aligned, or views may need to be displayed in different locations or to account for different widths or number of animation frames. |
| **5. Rebuilding** | Importing the translated strings back into the decompiled files, copying over new PIC and VIEW resources, applying game logic patches, copying over a Hebrew font, creating a WORDS.TOK.EXTENDED file, and then recompiling all of this into a new AGI game. |
| **6. Release** | Preparing a binary patch that can be applied by users who own a legal copy of the game. Preparing a patch for ScummVM to recognize the patched game as a Hebrew language version of the game. |

---

## This Package's Goals

Steps 3 and 4 in the workflow above are the hardest parts because this is where you actually have to translate text and develop modified graphics and logic.

The goal of this package is to automate, or at least simplify, everything else.

In particular, this package is meant to:

- Automate steps 1, 2 and 5
- Provide some tools for simplifying steps 3, 4, and 6
- Do all of this in a way that never results in copyrighted material being committed to version control

> **Note:** This package does not provide any tools for editing the graphics in PIC and VIEW files. WinAGI is a great tool for that.

---

## Usage

### 1. Game Preparation

To start with, you will need a .zip file that contains all the compiled files of your AGI game at the root. This can be, for example, a zipped version of the directory of a Sierra game you purchased on GOG.

If you don't have one or are just experimenting, you can use the example game provided by this repo in `example/example.zip`

**To prepare your game:**

1. Copy the .zip file into `project/`
2. Run `npm run init-translations`

This will decompile all game assets and replace message strings with indexed versions.

> The entire `project/` directory is ignored by git so nothing here will ever get copied to version control.

---

### 2. Text Extraction

Run:

```bash
npm run extract-translations
```

This will extract all the strings potentially requiring translation into four files in the `active-translation/` directory:

| File | Contents |
|------|----------|
| `messages.json` | All in-game messages |
| `objects.json` | Names of inventory objects |
| `views.json` | View descriptions |
| `vocabulary.json` | Command vocabulary synonym groups |

The files in here are your working files. They do get committed to version control and this is where you are going to do your translation work.

---

### 3. Text Translation

You can modify the string files in `active-translation/` directly with your favorite text editor, or:

```bash
npm run review:dev
```

This will launch a web server that provides a friendly UI for writing your translations, taking notes, and then exporting revised JSONs (which you will copy back to `active-translation/`).

> **Tip:** You can optionally use `npm run review:build` to build a version you can publish, for example as a GitHub Page, to share with other translators.

---

### 4. Game Modification

Using WinAGI or your other tool of choice, create the modified PIC, VIEW, and LOGIC files you need for your translated game to work.

When ready, create a subdirectory for your game in the `translations/` folder.

Copy the completed `*.json` files from `active-translation/` into that subdirectory. Also create `view/`, `pic/`, and `logic/` subdirectories which contain:

| Directory | Contents |
|-----------|----------|
| `view/` | Decompiled agiview and agiviewdesc files. You can use agikit-slim to convert .agv files from WinAGI into these formats. |
| `pic/` | Decompiled agipic files. You can use agikit-slim to convert .agp files from WinAGI into this format. |
| `logic/` | Patch files (.patch) that will patch .agilogic files. |

[TODO: automate/simplify more?]

---

### 5. Rebuilding

Run:

```bash
npm run release <translation-name>
```

For example: `npm run release example`

This will import all the translated strings, copy over the modified files, patch the logic files, copy over a Hebrew font, recompile the game, and zip it into a zip file.

Congratulations! You now should have a Hebrew version of your game!

#### Development builds

You can also run:

```bash
npm run release:dev <translation-name>
```

This does all of the above except instead of zipping it up it just copies the final files into the `play-build/` directory at the root of the repo (which is ignored by git). This is useful because you can just point ScummVM at this folder for rapid development and testing.

---

### 6. Releasing

TODO: Creating patches and modifying ScummVM detection_tables
