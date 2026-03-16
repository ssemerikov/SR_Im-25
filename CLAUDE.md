# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WebAR educational project using **Three.js** (3D rendering) and **MindAR** (image-target AR tracking). Weekly assignments build progressively: basic 3D scene → AR with markers → textured geometries → UI-controlled AR.

## Architecture

- **No build system** — pure browser ES modules via `<script type="importmap">` in each HTML file
- **No package manager** — libraries are vendored in `lib/` or loaded from CDN
- Each `weekN/` folder is a self-contained assignment with `test.html` (entry) + `main.js` (logic)
- `index.html` — landing page linking to all weekly assignments
- `assets/` — images (PNG/JPG) and `.mind` files (MindAR compiled image targets)

## Module Resolution

Week 1 uses CDN Three.js (v0.183.1). Weeks 2+ use local vendored libraries:
- `three` → `lib/three/three_151.module.js` (Three.js v0.151)
- `mindar-image-three` → `lib/mindar/mindar-image-three.prod.js`

Import maps are defined per-page in `test.html` — there is no shared config.

## Running Locally

Serve from project root with any static HTTP server (ES modules require HTTP, not `file://`):
```bash
python3 -m http.server 8000
# or
npx serve .
```
Then open `http://localhost:8000/weekN/test.html` for each assignment.

## Key Patterns

- MindAR initialization: `new MindARThree({container, imageTargetSrc})` → destructure `{renderer, scene, camera}` → add anchors → call `mindarThree.start()`
- Anchors bind 3D objects to tracked image targets: `mindarThree.addAnchor(index)` → `anchor.group.add(mesh)`
- Animation uses `renderer.setAnimationLoop()` callback
- `.mind` files are pre-compiled from reference images using the MindAR compiler tool

## Language

UI text is in Ukrainian. Variable names and code comments are in English.
