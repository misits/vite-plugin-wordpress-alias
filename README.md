# vite-plugin-wordpress-alias

A Vite plugin that transforms asset URLs to use Vite dev server URLs during development for WordPress themes. This ensures assets referenced with aliases or absolute paths work correctly when developing WordPress themes with Vite.

## Features

- 🚀 Transform `/src/` paths to Vite dev server URLs in development
- 🎨 Support for custom aliases (`@fonts`, `@svg`, `@images`, etc.)
- 📦 Works with CSS, SCSS, JavaScript, TypeScript, and Vue files
- 🔧 Zero-config for standard WordPress theme structures
- 🐛 Debug mode for troubleshooting transformations
- ⚡ Only runs in development mode (no production overhead)

## Installation

```bash
npm install --save-dev vite-plugin-wordpress-alias
```

or

```bash
yarn add -D vite-plugin-wordpress-alias
```

## Usage

### Basic Usage

Add the plugin to your `vite.config.js`:

```js
import { defineConfig } from 'vite';
import wordpressAlias from 'vite-plugin-wordpress-alias';

export default defineConfig({
  plugins: [
    wordpressAlias()
  ]
});
```

### With Custom Configuration
```js
import { defineConfig } from 'vite';
import wordpressAlias from 'vite-plugin-wordpress-alias';

export default defineConfig({
  plugins: [
    wordpressAlias({
      // Custom Vite dev server URL (default: 'http://localhost:5173')
      devServerUrl: 'http://localhost:3000',
      
      // Custom alias mappings
      aliases: {
        '@fonts': '/src/assets/fonts',
        '@svg': '/src/assets/svg',
        '@images': '/src/assets/images',
        '@videos': '/src/assets/videos'
      },
      
      // Enable debug logging (default: false)
      debug: true
    })
  ]
});
```

## How It Works

The plugin transforms asset URLs during development to point to Vite's dev server instead of the WordPress domain.

### CSS/SCSS Transformations

```scss
// Before transformation
.hero {
  background-image: url("/src/scss/assets/images/hero.jpg");
}

@font-face {
  src: url("@fonts/custom-font.woff2");
}

// After transformation (in development)
.hero {
  background-image: url("http://localhost:5173/src/scss/assets/images/hero.jpg");
}

@font-face {
  src: url("http://localhost:5173/src/scss/assets/fonts/custom-font.woff2");
}
```

### JavaScript Transformations

```js
// Before transformation
import logo from '/src/scss/assets/svg/logo.svg';
import font from '@fonts/custom-font.woff2';

// After transformation (in development)
import logo from 'http://localhost:5173/src/scss/assets/svg/logo.svg';
import font from 'http://localhost:5173/src/scss/assets/fonts/custom-font.woff2';
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `devServerUrl` | `string` | `'http://localhost:5173'` | The URL of your Vite dev server |
| `aliases` | `object` | `{}` | Custom alias mappings (e.g., `{ '@fonts': '/src/scss/assets/fonts' }`) |
| `debug` | `boolean` | `false` | Enable debug logging to see transformations |

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
│   │   ├── images/
│   │   └── videos/
│   ├── scss/
│   │   └── app.scss
│   └── javascript/
│       └── app.js
├── vite.config.js
└── functions.php
```

## Troubleshooting

### Enable Debug Mode

To see what transformations are happening:

```js
wordpressAlias({
  debug: true
})
```

### Common Issues

1. **Assets not loading**: Ensure your Vite dev server is running and accessible at the configured URL
2. **Aliases not working**: Check that your alias paths match your actual directory structure
3. **CORS errors**: Make sure your Vite server is configured with proper CORS headers

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

Created for WordPress theme developers who want to use modern build tools with Vite.