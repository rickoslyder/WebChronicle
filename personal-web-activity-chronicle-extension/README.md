# Personal Web Activity Chronicle Extension

This Chrome Extension logs your web activity (URLs, titles, scroll depth) and sends it to a Cloudflare Worker for processing (summarization, tagging, storage).

## Setup

1. Go to `chrome://extensions/` and enable Developer Mode.
2. Click **Load unpacked** and select the `personal-web-activity-chronicle-extension/` folder.
3. Open the **Options** page to configure your Worker endpoint and auth token.

## Development

- Source is structured under `background/`, `content/`, `options/`, and `lib/`.
- Run Chrome with your unpacked extension loaded.

## License

MIT
