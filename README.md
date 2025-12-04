# agivrit

A project designed to make it easy to start with a legally acquired copy of an AGI game, prepare it for translation to Hebrew, translate it to Hebrew, and the recompile the translated game.

This project is heavily inspired by the following projects:

- [Segev Maskraky's AGIHebrew](https://github.com/SegMash/AGIHebrew)
- [adventurebrew team](https://github.com/adventurebrew/re-quest)

The key changes from those projects are:

- Typescript scripts
- Use of agikit for CLI-based decompiling and compiling
- React based viewer for easy viewing and editing of translation jsons

## Overview of AGI Translation

The basic steps in translating an AGI game to Hebrew (or any language presumably) are:

1. Game Preparation: Decompiling the original AGI files and converting all message strings to indexed-references (e.g., `display(m1)` rather than `display("Hello, World)`

2. Text Extraction: Extracting all user-facing English text for (a) in-game messages, (b) inventory objects, (c) view descriptions, and (d) command vocabulary.

3. Translation: Translating all text to Hebrew, including both the strings extracted in step 2, but also text that is represneted visually in PIC or VIEW resources.

4. Game Modifications: Modifying game logic to account for RTL display and any other translation-required adjustments. For example, display() commands may need to be shifted to be right-aligned, or views may need to be displayed in different locations or to account for different widths or number of animation frames.

5. Rebuilding: Importing the translated strings back into the decompiled files, copying over new PIC and VIEW resources, applying game logic patches, coping over a Hebrew font, creating a WORDS.TOK.EXTENDED file, and then recompiling all of this into a new AGI game.

6. Release: Preparing a binary patch that can be applied by users who own a legal copy of the game. Preparing a patch for ScummVM to recognize the patched game as a Hebrew language version of the game.

## This Package's Goals

Steps 3 and 4 in the workflow above are the hardest parts because this is where you actually have to translate text and develop modified graphics and logic.

The goal of this package is to automate, or at least simplify, everything else.

In particular, this package is meant to:

- Automate steps 1, 2 and 5
- Provide some tools for simplifying steps 3, 4, and 6
- Do all of this in a way that never results in copyrighted material being comitted to version control

Note: This package does not provide any tools for editing the graphics in PIC and VIEW file. WinAGI is a great tool for that.

## Usage

### Game Preparation

To start with, you will need a .zip file that contains all the compiled files of your AGI game at the root. This can be, for example, a zipped version of the directory of a Sierra game you purchased on GOG.

If you don't have one or are just experimenting, you can use the example game provided by this repo in example/example.zip

To prepare your game:

- Copy the .zip file into projects/
- Run `npm run init-translations`

This will decompile all game assets and replace message strings with indexed versions

The entire projects/ directory is ignored by git so nothing here will ever get copied to version control

### Text Extraction

- Run `npm run extract-translations`

This will extract all the strings potentially requiring translation into four files in the directory active-translation/

- `messages.json`: All in-game messages
- `objects.json`: Names of inventory objects
- `views.json`: View descriptions
- `vocabulary.json` Command vocabulary synonym groups

The files in here are your working files. They do get committed to version control and this is where you are going to do your translation work.

### Text Translation

You can modify the string files in active-translation directly with your favorite text-editor OR

- Run `npm run review:dev` which will launch a webserver on port 3000 that provides a friendly UI for writing your translations, taking notes, and then exporting revised jsons (which you will copy back to active-translations/

(You can optionally use `npm run review:build` to build a version you can publish, for example as a Github Page, to share with other translators.)

### Game Modification

Using WinAGI or your other tool of choice, create the modified PIC, VIEW, and LOGIC files you need for your translated game to work.

When this is already create a subdirectory for your game in the translations/ folder.

Copy the completed \*.json files from active-translations into that subdirectory. Also create view/ pic/ and logic/ subdirectories which contain:

- view/: decompiled agiview and agiviewdesc files. you can use agikit-slim to convert agv files form WinAGI into these formats
- pic/: decompiled agipic files. you can use agikit-slim to convert agp files from WinAGI into this format
- logic/: .patch files that will patch .agilogic files.

[TODO: automate/simplify more?]

### Rebuilding

- Run `npm run release`

This will import all the translated strings, copy over the modified files, patch the logic files, copy over a Hebrew font, recompile the game, and zip it into a zip file.

Congratulations! You now should have a Hebrew version of your game!

You can also run `npm run release:dev` which does all of the above accept instead of zipping it up it just copies the final files into the play-buid/ directory at the root of the repo (which is ignored by git). This is nice because you can just point ScummVM at this folder for rapid development and testing.

### Releasing

TODO: Creating patches and modifying ScummVM detection_tables
