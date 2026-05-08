# AltStore Source Generator

This repository automatically generates an AltStore source by fetching the latest releases from GitHub repositories.

## How it works

1. The list of apps is maintained in `sources.json`.
2. A GitHub Action runs every 6 hours.
3. The script `scripts/generate.js` fetches release metadata and IPA assets from GitHub.
4. The generated `apps.json` is published to GitHub Pages.

## Usage

Add your apps to `sources.json` following the established format.
The source will be available at `https://<username>.github.io/<repository>/apps.json`.
