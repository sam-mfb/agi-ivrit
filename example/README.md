# Example AGI Project

This is an AGI template originally provided by the author of agikit, extended to demonstrate the translation workflow including view description extraction.

Original repo: https://github.com/nbudin/agikit-project-template

## Purpose

This example project demonstrates:

1. **AGI resource extraction** - Logic scripts, views, pictures, sounds, objects, vocabulary
2. **View description extraction** - Inventory item descriptions embedded in VIEW resources
3. **Translation workflow** - Extract → translate → import cycle
4. **Build process** - Compiling modified resources back to AGI game files

## Testing the Workflow

To test the full translation workflow using this example:

```bash
# 1. Copy example.zip to project/ directory
cp example/example.zip project/

# 2. Initialize project (extracts, decompiles, indexes)
npm run init-translations

# 3. Extract translations to active-translation/
npm run extract-translations

# 4. Review/edit translations
#    Files are in active-translation/*.json
#    Use npm run review:dev for web-based review

# 5. Build with example translations
npm run release:dev example    # Uses translations/example/
```

## Modifying the Example Game

If you need to modify the example game source:

```bash
# Edit files in example/src/
# Then rebuild the zip:
npm run rebuild-example
```

## View Description Demo

View 101 includes a description file (`101.agiviewdesc`) that demonstrates how inventory item descriptions are handled:

- When `show.obj(101)` is called in game logic, the view's description is displayed
- The description is stored separately from the binary view data for translation
- The build process merges `.agiviewdesc` files back into the compiled VIEW resources

## Directory Structure

```
example/
├── src/                # Source for building example game (committed)
│   ├── logic/         # *.agilogic scripts
│   ├── view/          # *.agiview binary + *.agiviewdesc text
│   ├── pic/           # *.agipic JSON
│   ├── object.json    # Inventory objects
│   ├── words.txt      # Vocabulary
│   └── ...
├── example.zip         # Pre-built game (committed)
├── agikit-project.json # AGI version config
└── README.md
```

## Translation Files

Pre-made Hebrew translations are available in `translations/example/`:

- `messages.json` - Game text messages with Hebrew translations
- `objects.json` - Inventory item names
- `vocabulary.json` - Parser vocabulary
- `views.json` - View descriptions (inventory item descriptions)
