# DayNight Mode ![Chrome Web Store](https://img.shields.io/chrome-web-store/v/YOUR_EXTENSION_ID?style=flat-square) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square) ![Built with WXT](https://img.shields.io/badge/Built_with-WXT-blue.svg?style=flat-square)

<p align="center">
  <img src="./assets/readme-hero.gif" alt="DayNight Mode Demo" width="100%">
</p>

This browser extension automatically applies a dark or light theme to websites based on the operating system's preferred color scheme.

## Features

-  🌓 **System-Aware Theming:** Dynamically applies CSS overrides to match the system's `prefers-color-scheme` (light/dark) setting.
-  ✅  **Selective Application:** Employs heuristics to detect and skip websites that provide their own native dark mode implementation, preventing style conflicts.
-  ⚙️ **Zero Configuration:** No popups or site settings.

## Install
`npm install & npm run build`

## How it Works

DayNight Mode listens for changes to the system's `prefers-color-scheme` media query. When the system preference is dark, the extension injects a CSS stylesheet designed to provide a consistent dark theme across websites. It attempts to identify sites with existing dark modes to avoid overriding them, ensuring compatibility and respecting site-specific designs.


## Tech Stack

Built using the modern [WXT](https://wxt.dev/) framework and TypeScript.

---

MIT License
