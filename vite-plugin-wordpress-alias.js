/**
 * vite-plugin-wordpress-alias
 * 
 * A Vite plugin that transforms asset URLs to use Vite dev server URLs
 * during development for WordPress themes. This ensures assets referenced
 * with aliases or absolute paths work correctly with WordPress.
 * 
 * @author Martin IS IT Services
 * @license MIT
 * @version 1.0.0
 */

/**
 * WordPress Alias Plugin for Vite
 * 
 * @param {Object} options - Plugin configuration options
 * @param {string} [options.devServerUrl='http://localhost:5173'] - Vite dev server URL
 * @param {Object} [options.aliases] - Custom alias mappings (e.g., { '@fonts': '/src/scss/assets/fonts' })
 * @param {boolean} [options.debug=false] - Enable debug logging
 * @returns {import('vite').Plugin} Vite plugin object
 * 
 * @example
 * // vite.config.js
 * import { defineConfig } from 'vite'
 * import wordpressAlias from 'vite-plugin-wordpress-alias'
 * 
 * export default defineConfig({
 *   plugins: [
 *     wordpressAlias({
 *       devServerUrl: 'http://localhost:5173',
 *       aliases: {
 *         '@fonts': '/src/scss/assets/fonts',
 *         '@svg': '/src/scss/assets/svg',
 *         '@images': '/src/scss/assets/images'
 *       },
 *       debug: false
 *     })
 *   ]
 * })
 */
export default function wordpressAlias(options = {}) {
    const {
        devServerUrl = 'http://localhost:5173',
        aliases = {},
        debug = false
    } = options;
    
    // Plugin name for Vite
    const pluginName = 'vite-plugin-wordpress-alias';
    
    /**
     * Logger utility
     * @param {...any} args - Arguments to log
     */
    const log = (...args) => {
        if (debug) {
            console.log(`[${pluginName}]`, ...args);
        }
    };
    
    // Log registration
    console.log(`[${pluginName}] Registered`);
    
    /**
     * Transform alias patterns to full URLs
     * @param {string} code - Source code to transform
     * @param {string} type - File type (css or js)
     * @returns {Object|null} Transformed code and map or null if no changes
     */
    const transformAliases = (code, type) => {
        let transformed = code;
        let hasChanges = false;
        
        // Build alias patterns from configuration
        const aliasPatterns = Object.entries(aliases).map(([alias, path]) => ({
            alias,
            path: path.startsWith('/') ? path : `/${path}`
        }));
        
        if (type === 'css') {
            // Transform /src/ paths in CSS
            const srcPatterns = [
                // Escaped quotes: url(\"/src/...\")
                {
                    regex: /url\(\\(["'])(\/src\/[^"'\\]+)\\(["'])\)/g,
                    replacement: (_match, quote1, path, quote2) => {
                        hasChanges = true;
                        const result = `url(\\${quote1}${devServerUrl}${path}\\${quote2})`;
                        log('Transform escaped URL:', path, '=>', `${devServerUrl}${path}`);
                        return result;
                    }
                },
                // Normal quotes: url("/src/...") or url('/src/...')
                {
                    regex: /url\((["'])(\/src\/[^"']+)(["'])\)/g,
                    replacement: (_match, quote1, path, quote2) => {
                        hasChanges = true;
                        const result = `url(${quote1}${devServerUrl}${path}${quote2})`;
                        log('Transform URL:', path, '=>', `${devServerUrl}${path}`);
                        return result;
                    }
                },
                // No quotes: url(/src/...)
                {
                    regex: /url\((\/src\/[^)]+)\)/g,
                    replacement: (_match, path) => {
                        hasChanges = true;
                        const result = `url(${devServerUrl}${path})`;
                        log('Transform unquoted URL:', path, '=>', `${devServerUrl}${path}`);
                        return result;
                    }
                }
            ];
            
            // Apply /src/ transformations
            for (const pattern of srcPatterns) {
                if (transformed.match(pattern.regex)) {
                    transformed = transformed.replace(pattern.regex, pattern.replacement);
                }
            }
            
            // Transform custom aliases in CSS (e.g., @fonts, @svg)
            for (const { alias, path } of aliasPatterns) {
                const aliasRegexes = [
                    // url("@alias/file.ext")
                    {
                        regex: new RegExp(`url\\((["\'])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/([^"']+)(["\'])\\)`, 'g'),
                        replacement: (_match, quote1, file, quote2) => {
                            hasChanges = true;
                            const result = `url(${quote1}${devServerUrl}${path}/${file}${quote2})`;
                            log('Transform alias:', `${alias}/${file}`, '=>', `${devServerUrl}${path}/${file}`);
                            return result;
                        }
                    },
                    // url(@alias/file.ext) - no quotes
                    {
                        regex: new RegExp(`url\\(${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/([^)]+)\\)`, 'g'),
                        replacement: (_match, file) => {
                            hasChanges = true;
                            const result = `url(${devServerUrl}${path}/${file})`;
                            log('Transform unquoted alias:', `${alias}/${file}`, '=>', `${devServerUrl}${path}/${file}`);
                            return result;
                        }
                    }
                ];
                
                for (const aliasPattern of aliasRegexes) {
                    if (transformed.match(aliasPattern.regex)) {
                        transformed = transformed.replace(aliasPattern.regex, aliasPattern.replacement);
                    }
                }
            }
        }
        
        if (type === 'js') {
            // Asset extensions to transform
            const assetExtensions = 'svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf|eot|mp4|webm|ogg';
            
            // Transform /src/ paths in JavaScript
            const jsPatterns = [
                // Import statements: import image from "/src/..."
                {
                    regex: new RegExp(`(import\\s+.+\\s+from\\s+["'])(\/src\/[^"']+\\.(${assetExtensions}))(['"])`, 'g'),
                    replacement: (_match, before, path, _ext, after) => {
                        hasChanges = true;
                        log('Transform JS import:', path, '=>', `${devServerUrl}${path}`);
                        return `${before}${devServerUrl}${path}${after}`;
                    }
                },
                // Dynamic imports: import("/src/...")
                {
                    regex: new RegExp(`(import\\s*\\(\\s*["'])(\/src\/[^"']+\\.(${assetExtensions}))(['"])`, 'g'),
                    replacement: (_match, before, path, _ext, after) => {
                        hasChanges = true;
                        log('Transform dynamic import:', path, '=>', `${devServerUrl}${path}`);
                        return `${before}${devServerUrl}${path}${after}`;
                    }
                },
                // HTML attributes: src="/src/..."
                {
                    regex: new RegExp(`(src|href|poster|data)(\\s*=\\s*["'])(\/src\/[^"']+\\.(${assetExtensions}))(['"])`, 'g'),
                    replacement: (_match, attr, equals, path, _ext, quote) => {
                        hasChanges = true;
                        log('Transform attribute:', path, '=>', `${devServerUrl}${path}`);
                        return `${attr}${equals}${devServerUrl}${path}${quote}`;
                    }
                },
                // Object properties: backgroundImage: "/src/..."
                {
                    regex: new RegExp(`(backgroundImage|src|href|poster|image|icon|logo|avatar|thumbnail|background)(\\s*:\\s*["'])(\/src\/[^"']+\\.(${assetExtensions}))(['"])`, 'g'),
                    replacement: (_match, prop, colon, path, _ext, quote) => {
                        hasChanges = true;
                        log('Transform property:', path, '=>', `${devServerUrl}${path}`);
                        return `${prop}${colon}${devServerUrl}${path}${quote}`;
                    }
                }
            ];
            
            // Apply JS transformations
            for (const pattern of jsPatterns) {
                if (transformed.match(pattern.regex)) {
                    transformed = transformed.replace(pattern.regex, pattern.replacement);
                }
            }
            
            // Transform custom aliases in JavaScript
            for (const { alias, path } of aliasPatterns) {
                const aliasJsPatterns = [
                    // import image from "@alias/file.ext"
                    {
                        regex: new RegExp(`(import\\s+.+\\s+from\\s+["'])${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/([^"']+\\.(${assetExtensions}))(['"])`, 'g'),
                        replacement: (_match, before, file, _ext, after) => {
                            hasChanges = true;
                            log('Transform JS alias import:', `${alias}/${file}`, '=>', `${devServerUrl}${path}/${file}`);
                            return `${before}${devServerUrl}${path}/${file}${after}`;
                        }
                    }
                ];
                
                for (const aliasPattern of aliasJsPatterns) {
                    if (transformed.match(aliasPattern.regex)) {
                        transformed = transformed.replace(aliasPattern.regex, aliasPattern.replacement);
                    }
                }
            }
        }
        
        return hasChanges ? { code: transformed, map: null } : null;
    };
    
    /**
     * Vite Plugin Object
     * @see https://vitejs.dev/guide/api-plugin.html
     */
    return {
        name: pluginName,
        
        // Only apply during development
        apply: 'serve',
        
        // Run after other plugins (like SCSS compilation)
        enforce: 'post',
        
        /**
         * Transform hook - processes modules after compilation
         * @param {string} code - Source code
         * @param {string} id - Module ID (file path)
         * @returns {Object|null} Transformed code or null
         */
        transform(code, id) {
            // Determine file type
            const isCss = id.match(/\.(css|scss|sass|less|styl)($|\?)/);
            const isJs = id.match(/\.(js|jsx|ts|tsx|vue)($|\?)/);
            
            if (isCss) {
                log('Processing CSS:', id);
                return transformAliases(code, 'css');
            }
            
            if (isJs) {
                log('Processing JS:', id);
                return transformAliases(code, 'js');
            }
            
            return null;
        }
    };
}