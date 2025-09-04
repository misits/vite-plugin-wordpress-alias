# vite-plugin-wordpress-alias

A Vite plugin that transforms asset URLs to use Vite dev server URLs during development for WordPress themes. This ensures assets referenced with aliases or absolute paths work correctly when developing WordPress themes with Vite.

## Features

- 🚀 Transform `/src/` paths to Vite dev server URLs in development
- 🎨 **Zero configuration** - automatically detects and transforms custom aliases (`@fonts`, `@svg`, `@images`, etc.)
- 📦 Works with CSS, SCSS, JavaScript, TypeScript, Vue, and JSX files
- 🔧 Automatically uses your existing Vite `resolve.alias` configuration
- ⚡ Only runs in development mode (no production overhead)
- 🎯 Clean, well-documented code ready for production use

## Why?

**The WordPress + Vite Problem:** When developing WordPress themes with Vite, you're running two servers:
- **WordPress site** (e.g., `https://mysite.local`) - serves your PHP theme
- **Vite dev server** (`http://localhost:5173`) - serves your assets with HMR

**The Issue:** Your CSS/JS runs in the WordPress context, so when it tries to load assets like `url("/src/assets/logo.svg")`, the browser looks for them on your WordPress domain instead of the Vite dev server, causing 404 errors.

**The Solution:** This plugin automatically converts all asset paths to use your Vite dev server URL during development:

```scss
// ❌ Browser tries: https://mysite.local/src/assets/logo.svg (404 error)
background: url("/src/assets/logo.svg");

// ✅ Plugin converts to: http://localhost:5173/src/assets/logo.svg (works!)
```

**Universal:** While built for WordPress, this works with any setup where you need assets served from Vite's dev server instead of your main site domain.

## Installation

```bash
npm install --save-dev vite-plugin-wordpress-alias
```

or

```bash
yarn add -D vite-plugin-wordpress-alias
```

## Usage

### Basic Usage (Recommended)

Add the plugin to your `vite.config.js`:

```js
import { defineConfig } from 'vite';
import wordpressAlias from 'vite-plugin-wordpress-alias';

export default defineConfig({
  plugins: [
    wordpressAlias()
  ],
  resolve: {
    alias: {
      "@": "./src/",
      "@assets": "./src/assets",
      "@svg": "./src/assets/svg",
      "@fonts": "./src/assets/fonts",
      "@images": "./src/assets/images",
      // ... your other aliases
    }
  }
});
```

### With Custom Dev Server URL
```js
import { defineConfig } from 'vite';
import wordpressAlias from 'vite-plugin-wordpress-alias';

export default defineConfig({
  plugins: [
    wordpressAlias({
      devServerUrl: 'http://localhost:3000' // Default: 'http://localhost:5173'
    })
  ]
});
```

## How It Works

The plugin automatically detects your Vite aliases from `resolve.alias` and transforms asset URLs during development to point to Vite's dev server instead of the WordPress domain.

### CSS/SCSS Transformations

```scss
// Before transformation
.hero {
  background-image: url("/src/assets/images/hero.jpg");
}

@font-face {
  src: url("@fonts/custom-font.woff2");
}

// After transformation (in development)
.hero {
  background-image: url("http://localhost:5173/src/assets/images/hero.jpg");
}

@font-face {
  src: url("http://localhost:5173/src/assets/fonts/custom-font.woff2");
}
```

### JavaScript Transformations

```js
// Before transformation
import logo from '/src/assets/svg/logo.svg';
const bgImage = '/src/assets/images/bg.jpg';

// After transformation (in development)
import logo from 'http://localhost:5173/src/assets/svg/logo.svg';
const bgImage = 'http://localhost:5173/src/assets/images/bg.jpg';
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `devServerUrl` | `string` | `'http://localhost:5173'` | The URL of your Vite dev server |

## Supported File Types

### CSS Files
- `.css`
- `.scss`
- `.sass`
- `.less`
- `.styl`

### JavaScript Files
- `.js`
- `.jsx`
- `.ts`
- `.tsx`
- `.vue`

### Asset Types
- Images: `svg`, `png`, `jpg`, `jpeg`, `gif`, `webp`
- Fonts: `woff`, `woff2`, `ttf`, `otf`, `eot`
- Videos: `mp4`, `webm`, `ogg`

## WordPress Theme Setup

This plugin is designed to work with WordPress themes that use Vite for asset bundling. Here's the recommended modern structure:

```
wp-content/themes/your-theme/
├── src/
│   ├── assets/
│   │   ├── fonts/
│   │   ├── svg/
│   │   └── images/
│   ├── scss/
│   │   └── app.scss
│   └── javascript/
│       └── app.js
├── vite.config.js
└── functions.php
```

## Example WordPress Theme Integration

```js
// vite.config.js
import { defineConfig } from 'vite';
import wordpressAlias from 'vite-plugin-wordpress-alias';

export default defineConfig({
  plugins: [
    wordpressAlias()
  ],
  resolve: {
    alias: {
      "@fonts": resolve(__dirname, "./src/scss/assets/fonts"),
      "@svg": resolve(__dirname, "./src/scss/assets/svg"),
    }
  },
});
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

Created for WordPress theme developers who want to use modern build tools with Vite.