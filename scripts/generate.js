import fs from 'fs';
import path from 'path';
import axios from 'axios';

const SOURCES_FILE = 'sources.json';
const OUTPUT_DIR = 'public';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'apps.json');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const headers = {
    'Accept': 'application/vnd.github+json',
};

if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
}

async function fetchLatestRelease(repo, includePrereleases) {
    const url = includePrereleases 
        ? `https://api.github.com/repos/${repo}/releases`
        : `https://api.github.com/repos/${repo}/releases/latest`;

    try {
        const response = await axios.get(url, { headers });
        let release = response.data;

        if (Array.isArray(release)) {
            // If we fetched a list, find the first one that matches our criteria
            release = release.find(r => !r.draft && (includePrereleases || !r.prerelease));
        }

        if (!release) {
            throw new Error(`No valid release found for ${repo}`);
        }

        return release;
    } catch (error) {
        console.error(`Error fetching release for ${repo}: ${error.message}`);
        return null;
    }
}

function findIpaAsset(release) {
    return release.assets.find(asset => asset.name.toLowerCase().endsWith('.ipa'));
}

async function generateSource() {
    console.log('Starting source generation...');

    if (!fs.existsSync(SOURCES_FILE)) {
        console.error(`${SOURCES_FILE} not found.`);
        process.exit(1);
    }

    const sources = JSON.parse(fs.readFileSync(SOURCES_FILE, 'utf8'));
    const apps = [];

    for (const source of sources) {
        console.log(`Processing ${source.name} (${source.githubRepo})...`);
        
        const release = await fetchLatestRelease(source.githubRepo, source.includePrereleases);
        if (!release) continue;

        const ipaAsset = findIpaAsset(release);
        if (!ipaAsset) {
            console.warn(`No IPA asset found for ${source.name} in release ${release.tag_name}. Skipping.`);
            continue;
        }

        const appEntry = {
            name: source.name,
            bundleIdentifier: source.bundleIdentifier,
            developerName: source.developerName,
            subtitle: source.subtitle,
            localizedDescription: source.localizedDescription,
            iconURL: source.iconURL,
            tintColor: source.tintColor,
            screenshotURLs: source.screenshotURLs || [],
            versions: [
                {
                    version: release.tag_name.replace(/^v/, ''),
                    date: release.published_at,
                    downloadURL: ipaAsset.browser_download_url,
                    localizedDescription: release.body || "No release notes provided.",
                    size: ipaAsset.size
                }
            ]
        };

        apps.push(appEntry);
    }

    // Source Metadata
    // Ideally these would be configurable, but for now we'll use defaults
    // or try to infer from the environment if available.
    const repoFullName = process.env.GITHUB_REPOSITORY;
    const [owner, repo] = repoFullName.split('/');

    const sourceData = {
        name:  process.env.SOURCE_NAME || `Plezy AltStore Source`,
        identifier: process.env.SOURCE_IDENTIFIER || `com.edde746.plezy-source`,
        subtitle: process.env.SOURCE_SUBTITLE || "Plezy AltStore Source",
        description: process.env.SOURCE_DESCRIPTION || "Plezy AltStore Source",
        iconURL: `https://raw.githubusercontent.com/edde746/plezy/refs/heads/main/assets/plezy.png`,
        website: `https://github.com/${repoFullName}`,
        apps: apps
    };

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sourceData, null, 2));
    console.log(`Successfully generated ${OUTPUT_FILE} with ${apps.length} apps.`);
}

generateSource().catch(err => {
    console.error('Fatal error during generation:', err);
    process.exit(1);
});
