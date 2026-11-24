# CLAUDE.md

## Design reference

The UI is designed in the Claude Design canvas **"Game Tracker"** (Playshelf):
https://claude.ai/artifact/P9ZN6TV17jxyJU5agtdD6k

The canvas changes over time, so don't rely on a remembered list of its pages. When building or changing frontend pages and components:

1. Read `project/canvas.json` from the artifact (Artifact tool, `read` action with `path`). It is the live index: `boards` lists every artboard, keyed by file name, with a `title` naming the screen.
2. Pick the artboard(s) matching the page you're working on and read those `project/<file>.dc.html` files.
3. Match their layout, colors, type and spacing in the React code.

If an artboard has no matching page in the app yet, mention it instead of guessing where it belongs.
