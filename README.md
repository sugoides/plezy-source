# Plezy AltStore Source

This repository automatically generates and maintains the official AltStore source for **Plezy**, fetching the latest releases from [edde746/plezy](https://github.com/edde746/plezy).

## Setup Instructions

### 1. Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.

### 2. Configure Secrets (Optional)
If you are tracking private repositories or hitting rate limits, add a `GITHUB_TOKEN` to your repository secrets.

## How it works

1. The list of apps is maintained in `sources.json`.
2. A GitHub Action runs every 6 hours.
3. The script `scripts/generate.js` fetches release metadata and IPA assets from GitHub.
4. The generated `apps.json` is published to GitHub Pages.

## Usage

Add your apps to `sources.json` following the established format.
The source will be available at `https://<username>.github.io/<repository>/apps.json`.
