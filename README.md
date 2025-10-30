# YouTube Music Animated Artwork Toggle

A Chrome extension that replaces the static album art on YouTube Music with Apple Music's animated artwork (when available). Toggle the feature on/off instantly from the popup.

Looking for another language? Read the Thai translation in `README.th.md`.

## Highlights

- Live animated artwork rendered as a looping video overlay
- Smart Apple Music matching with case-insensitive comparisons and album title fuzziness for deluxe or alternate releases
- Automatic fallback to the original art whenever no animation exists for the current track
- Remembers the toggle state using the Chrome Storage API

## Installation (Developer Mode)

1. Download or `git clone` this repository: `youtube-music-artwork-toggle`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the project folder
5. (Optional) Generate icons via `icons/create-icons.html` and place the downloaded PNGs inside the `icons/` directory

## Usage

1. Open https://music.youtube.com and start playing a song
2. Click the extension icon in the Chrome toolbar
3. Toggle the switch to enable animated artwork
4. The extension looks up the current song on Apple Music and swaps the artwork automatically when a match is found

## Project Layout

```
youtube-music-artwork-toggle/
├── background.js       # Service worker: Apple Music lookup + animated-art fetch
├── content.js          # Runs on YouTube Music: song detection, DOM updates
├── manifest.json       # Chrome Extension Manifest V3
├── popup.html/.css/.js # Popup UI and toggle logic
├── styles.css          # Additional styling injected into the page
└── icons/              # Icon assets and icon-generation helper
```

## Development Tips

- Flip the popup toggle to verify the stored state in `chrome.storage.local`
- Test with songs that do and do not have animated artwork to confirm fallback behavior
- Debug the content script via DevTools on the YouTube Music tab, and the background worker through `chrome://extensions/` (open the service worker console)

## Notes

- Works only on `https://music.youtube.com`
- When Apple Music returns no animated clip, the original static artwork is restored immediately
- Apple Music API rate limits and timeouts can occur; check the console logs for diagnostics

## License

MIT License