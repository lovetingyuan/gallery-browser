# Gallery Browser

A local-first, blazing-fast image and video viewer inside your web browser. 

**Live Demo (No backend, your files stay on your device):**
[https://gallery-browser.tingyuan.in](https://gallery-browser.tingyuan.in)

## Features

- **Local-First Privacy**: Uses the modern [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) to read your local folders directly in the browser.
- **Zero Uploads**: Your media files never leave your computer. There is no backend server.
- **Fast & Responsive**: Built with Vue 3, Vite, and Tailwind CSS.
- **Media Support**: Seamlessly views common image formats (JPG, PNG, GIF, WebP, SVG) and videos (MP4, WebM, OGG).
- **Lightbox**: Immersive full-screen viewing experience powered by GLightbox.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Deploy to Cloudflare Pages/Workers

```sh
npm run deploy
```
