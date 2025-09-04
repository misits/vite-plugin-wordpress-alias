/**
 * vite-plugin-wordpress-alias
 * 
 * A Vite plugin that transforms asset URLs to use Vite dev server URLs during development
 * for WordPress themes. This ensures assets referenced with aliases or absolute paths work
 * correctly when developing WordPress themes with Vite.
 * 
 * Features:
 * - Transforms /src/ paths to Vite dev server URLs
 * - Automatically detects and transforms custom aliases (@svg, @fonts, etc.)
 * - Works with CSS, SCSS, JavaScript, TypeScript, Vue, and JSX files
 * - Zero configuration - automatically uses Vite's resolve.alias settings
 * - Only runs in development mode
 * 
 * @author Martin IS IT Services
 * @license MIT
 * @version 1.0.0
 */

/**
 * Transform CSS/SCSS files to handle /src/ paths and custom aliases
 * 
 * @param {string} code - The CSS code to transform
 * @param {string} devServerUrl - The Vite dev server URL
 * @param {Object} aliases - Alias mappings from Vite config
 * @returns {Object} Result object with transformed code and hasChanges flag
 * 
 * @example
 * // Before transformation
 * background-image: url("/src/assets/images/hero.jpg");
 * background-image: url("@svg/logo.svg");
 * 
 * // After transformation
 * background-image: url("http://localhost:5173/src/assets/images/hero.jpg");
 * background-image: url("http://localhost:5173/src/assets/svg/logo.svg");
 */
function transformCSSFiles(code, devServerUrl, aliases) {
    let transformed = code;
    let hasChanges = false;
    
    // Handle /src/ paths
    const cssPatterns = [
        // Escaped quotes: url(\"/src/...\")
        {
            regex: /url\(\\(["'])(\/src\/[^"'\\]+)\\(["'])\)/g,
            replacement: (_match, quote1, path, quote2) => {
                hasChanges = true;
                return `url(\\${quote1}${devServerUrl}${path}\\${quote2})`;
            }
        },
        // Normal quotes: url("/src/...") or url('/src/...')
        {
            regex: /url\((["'])(\/src\/[^"']+)(["'])\)/g,
            replacement: (_match, quote1, path, quote2) => {
                hasChanges = true;
                return `url(${quote1}${devServerUrl}${path}${quote2})`;
            }
        },
        // No quotes: url(/src/...)
        {
            regex: /url\((\/src\/[^)]+)\)/g,
            replacement: (_match, path) => {
                hasChanges = true;
                return `url(${devServerUrl}${path})`;
            }
        }
    ];
    
    // Apply /src/ patterns
    cssPatterns.forEach(pattern => {
        if (transformed.match(pattern.regex)) {
            transformed = transformed.replace(pattern.regex, pattern.replacement);
        }
    });

    // Handle custom aliases (e.g., @svg, @fonts)
    Object.entries(aliases).forEach(([alias, aliasPath]) => {
        // Convert absolute path back to relative path for URL transformation
        // From: /Users/username/.../wp-content/themes/fsd/src/assets/svg
        // To: /src/assets/svg
        let cleanPath = aliasPath;
        if (typeof aliasPath === 'string') {
            if (aliasPath.includes('/src/')) {
                const srcIndex = aliasPath.indexOf('/src/');
                cleanPath = aliasPath.substring(srcIndex);
            } else {
                cleanPath = aliasPath.startsWith('./') ? aliasPath.slice(1) : aliasPath.startsWith('/') ? aliasPath : `/${aliasPath}`;
            }
        }
        
        // Handle quoted aliases: url("@svg/file.svg")
        const quotedRegex = new RegExp(`url\\((["\'])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([^"']+)(["\'])\\)`, 'g');
        if (transformed.match(quotedRegex)) {
            transformed = transformed.replace(quotedRegex, (_match, quote1, file, quote2) => {
                hasChanges = true;
                return `url(${quote1}${devServerUrl}${cleanPath}/${file}${quote2})`;
            });
        }
        
        // Handle unquoted aliases: url(@svg/file.svg)
        const unquotedRegex = new RegExp(`url\\(${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/([^)]+)\\)`, 'g');
        if (transformed.match(unquotedRegex)) {
            transformed = transformed.replace(unquotedRegex, (_match, file) => {
                hasChanges = true;
                return `url(${devServerUrl}${cleanPath}/${file})`;
            });
        }
    });
    
    return { code: transformed, hasChanges };
}

/**
 * Transform JavaScript files to handle /src/ asset paths
 * 
 * @param {string} code - The JavaScript code to transform
 * @param {string} devServerUrl - The Vite dev server URL
 * @returns {Object} Result object with transformed code and hasChanges flag
 * 
 * @example
 * // Before transformation
 * import logo from '/src/assets/images/logo.png';
 * const bgImage = '/src/assets/images/bg.jpg';
 * 
 * // After transformation
 * import logo from 'http://localhost:5173/src/assets/images/logo.png';
 * const bgImage = 'http://localhost:5173/src/assets/images/bg.jpg';
 */
function transformJSFiles(code, devServerUrl) {
    let transformed = code;
    let hasChanges = false;
    
    // Asset file extensions
    const assetExtensions = 'svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|eot|mp4|webm|ogg';
    
    // JavaScript transformation patterns
    const jsPatterns = [
        // Import statements: import image from "/src/..."
        {
            regex: new RegExp(`(import\\s+.+\\s+from\\s+["'])(/src/[^"']+.(${assetExtensions}))(['"])`, 'g'),
            replacement: (_match, before, path, _ext, after) => {
                hasChanges = true;
                return `${before}${devServerUrl}${path}${after}`;
            }
        },
        // Dynamic imports: import("/src/...")
        {
            regex: new RegExp(`(import\\s*\\(\\s*["'])(/src/[^"']+.(${assetExtensions}))(['"])`, 'g'),
            replacement: (_match, before, path, _ext, after) => {
                hasChanges = true;
                return `${before}${devServerUrl}${path}${after}`;
            }
        },
        // HTML attributes: src="/src/...", href="/src/..."
        {
            regex: new RegExp(`(src|href|poster|data)(\\s*=\\s*["'])(/src/[^"']+.(${assetExtensions}))(['"])`, 'g'),
            replacement: (_match, attr, equals, path, _ext, quote) => {
                hasChanges = true;
                return `${attr}${equals}${devServerUrl}${path}${quote}`;
            }
        },
        // Object properties: backgroundImage: "/src/..."
        {
            regex: new RegExp(`(backgroundImage|src|href|poster|image|icon|logo|avatar|thumbnail|background)(\\s*:\\s*["'])(/src/[^"']+.(${assetExtensions}))(['"])`, 'g'),
            replacement: (_match, prop, colon, path, _ext, quote) => {
                hasChanges = true;
                return `${prop}${colon}${devServerUrl}${path}${quote}`;
            }
        }
    ];
    
    // Apply JavaScript patterns
    jsPatterns.forEach(pattern => {
        if (transformed.match(pattern.regex)) {
            transformed = transformed.replace(pattern.regex, pattern.replacement);
        }
    });
    
    return { code: transformed, hasChanges };
}

/**
 * WordPress Alias Plugin for Vite
 * 
 * @param {Object} [options={}] - Plugin configuration options
 * @param {string} [options.devServerUrl='http://localhost:5173'] - Vite dev server URL
 * @returns {import('vite').Plugin} Vite plugin object
 * 
 * @example
 * // Basic usage
 * import wordpressAlias from 'vite-plugin-wordpress-alias';
 * 
 * export default defineConfig({
 *   plugins: [
 *     wordpressAlias()
 *   ]
 * });
 * 
 * @example
 * // With custom dev server URL
 * import wordpressAlias from 'vite-plugin-wordpress-alias';
 * 
 * export default defineConfig({
 *   plugins: [
 *     wordpressAlias({
 *       devServerUrl: 'http://localhost:3000'
 *     })
 *   ]
 * });
 */
export default function wordpressAlias(options = {}) {
    const {
        devServerUrl = 'http://localhost:5173'
    } = options;
    
    console.log('🚀 \x1b[36mvite-plugin-wordpress-alias\x1b[0m \x1b[32m✓\x1b[0m registered');
    
    let aliases = {};
    
    return {
        name: 'vite-plugin-wordpress-alias',
        apply: 'serve', // Only apply in dev server mode
        enforce: 'post', // Run after other plugins including SCSS compilation
        
        /**
         * Hook called when Vite config is resolved
         * Extracts aliases from Vite's resolve.alias configuration
         * 
         * @param {Object} config - Resolved Vite configuration
         */
        configResolved(config) {
            aliases = config.resolve.alias || {};
        },
        
        /**
         * Transform hook - processes code after compilation
         * Transforms asset URLs in CSS and JavaScript files to use Vite dev server URLs
         * 
         * @param {string} code - The source code to transform
         * @param {string} id - The file path/id being processed
         * @returns {Object|null} Transformation result with code and source map, or null if no changes
         */
        transform(code, id) {
            let transformed = code;
            let hasChanges = false;
            
            // Process CSS/SCSS files
            if (id.match(/\.(css|scss|sass|less|styl)($|\?)/)) {
                const cssResult = transformCSSFiles(transformed, devServerUrl, aliases);
                transformed = cssResult.code;
                hasChanges = cssResult.hasChanges;
            }
            
            // Process JavaScript/TypeScript/Vue/JSX files
            if (id.match(/\.(js|jsx|ts|tsx|vue)($|\?)/)) {
                const jsResult = transformJSFiles(transformed, devServerUrl);
                transformed = jsResult.code;
                hasChanges = hasChanges || jsResult.hasChanges;
            }
            
            return hasChanges ? { code: transformed, map: null } : null;
        }
    };
}