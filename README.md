# Strata Desktop

A desktop application built with Electron + React + Vite for organizing and viewing content through an integrated notebook-style interface. Supports local-first file storage, Google Drive sync, embedded web pages, diagrams, maps, tables, and more.

## Features

- Notebook and page tree navigation
- **Local-first persistence** — data saved to `~/Documents/Strata/` as plain JSON files, readable and backupable
- Google Drive sync (Docs, Sheets, Slides, PDFs, Drawings, Forms, Maps) as optional background sync
- Automatic migration from localStorage on first run
- Embedded web pages via native Electron WebContentsView (any URL)
- Tab hibernation with LRU eviction and snapshot previews
- Lucidchart, Miro, Draw.io, and PDF embed support
- Rich content blocks (text, lists, images, code, tables, Mermaid diagrams)
- Leaflet map pages with custom markers
- Undo/redo history
- Offline viewer mode

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or later
- npm (bundled with Node.js)

## Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/<your-username>/strata-desktop.git
   cd strata-desktop
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in your Google OAuth credentials:

   ```
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your-google-api-key
   ```

   You can obtain these from the [Google Cloud Console](https://console.cloud.google.com/) by creating an OAuth 2.0 Client ID and an API key for the Google Drive and Picker APIs.

4. **Run in development mode**

   ```bash
   npm run dev
   ```

5. **Build for production**

   ```bash
   npm run build
   ```

   The built app will be in the `out/` directory. On Windows you can also use `launch.bat` after building.

## Tech Stack

- [Electron](https://www.electronjs.org/) v35
- [React](https://react.dev/) v19
- [Vite](https://vite.dev/) via [electron-vite](https://electron-vite.org/)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [CodeMirror](https://codemirror.net/) (code block editor)
- [Mermaid](https://mermaid.js.org/) (diagram rendering)
- [Leaflet](https://leafletjs.com/) (map pages)

## Data Storage

In the desktop app, all data is saved locally to `~/Documents/Strata/`:

| File | Contents |
|---|---|
| `data.json` | All notebooks, tabs, pages, and blocks |
| `settings.json` | Theme, column limits, background page settings |
| `last-view.json` | Last active notebook, tab, and page for session restore |

On first launch, any existing localStorage data from a previous browser-based session is automatically migrated to disk. Google Drive sync remains available as an optional background sync layer.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID for Drive access |
| `VITE_GOOGLE_API_KEY` | Google API key for Drive Picker |
| `VITE_STRATA_DEBUG_SYNC` | Set to `true` to enable verbose sync logging |
