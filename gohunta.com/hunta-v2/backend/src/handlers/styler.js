/**
 * UI Styler Handler - Dynamic Style Configuration
 * Manages theme customization and style settings
 */

export async function stylerHandler(request, path, env) {
    const method = request.method;
    
    try {
        if (path === '/api/styler/config' && method === 'GET') {
            return await getStyleConfig(request, env);
        } else if (path === '/api/styler/config' && method === 'PUT') {
            return await updateStyleConfig(request, env);
        } else if (path === '/api/styler/themes' && method === 'GET') {
            return await getThemes(request, env);
        } else if (path === '/api/styler/theme' && method === 'POST') {
            return await createTheme(request, env);
        } else if (path === '/api/styler/preview' && method === 'POST') {
            return await previewStyles(request, env);
        } else if (path === '/api/styler/export' && method === 'GET') {
            return await exportStyles(request, env);
        } else {
            return errorResponse('Styler endpoint not found', 404);
        }
    } catch (error) {
        console.error('Styler handler error:', error);
        return errorResponse('Styler operation failed', 500);
    }
}

async function getStyleConfig(request, env) {
    try {
        // Try to get saved config from KV
        if (env.CACHE) {
            const config = await env.CACHE.get('style_config', 'json');
            if (config) {
                return successResponse(config);
            }
        }

        // Return default config
        return successResponse({
            theme: 'default',
            colors: {
                primary: {
                    name: 'Hunta Green',
                    value: '#2D5530',
                    rgb: '45, 85, 48',
                    usage: 'Primary brand color, buttons, headers'
                },
                primaryLight: {
                    name: 'Hunta Green Light',
                    value: '#3A6B3E',
                    rgb: '58, 107, 62',
                    usage: 'Hover states, secondary buttons'
                },
                secondary: {
                    name: 'Hunta Orange',
                    value: '#D97706',
                    rgb: '217, 119, 6',
                    usage: 'Accent color, alerts, CTAs'
                },
                background: {
                    name: 'Background',
                    value: '#F9FAFB',
                    rgb: '249, 250, 251',
                    usage: 'Main background color'
                },
                surface: {
                    name: 'Surface',
                    value: '#FFFFFF',
                    rgb: '255, 255, 255',
                    usage: 'Cards, modals, elevated surfaces'
                },
                text: {
                    name: 'Text Primary',
                    value: '#1F2937',
                    rgb: '31, 41, 55',
                    usage: 'Main text color'
                },
                textSecondary: {
                    name: 'Text Secondary',
                    value: '#6B7280',
                    rgb: '107, 114, 128',
                    usage: 'Secondary text, hints'
                },
                border: {
                    name: 'Border',
                    value: '#E5E7EB',
                    rgb: '229, 231, 235',
                    usage: 'Borders, dividers'
                },
                success: {
                    name: 'Success',
                    value: '#10B981',
                    rgb: '16, 185, 129',
                    usage: 'Success messages, positive states'
                },
                warning: {
                    name: 'Warning',
                    value: '#F59E0B',
                    rgb: '245, 158, 11',
                    usage: 'Warning messages, caution states'
                },
                error: {
                    name: 'Error',
                    value: '#EF4444',
                    rgb: '239, 68, 68',
                    usage: 'Error messages, destructive actions'
                }
            },
            typography: {
                fontFamily: {
                    primary: "'Inter', system-ui, -apple-system, sans-serif",
                    secondary: "'Inter', sans-serif",
                    mono: "'Fira Code', 'Consolas', monospace"
                },
                fontSize: {
                    xs: '0.75rem',    // 12px
                    sm: '0.875rem',   // 14px
                    base: '1rem',     // 16px
                    lg: '1.125rem',   // 18px
                    xl: '1.25rem',    // 20px
                    '2xl': '1.5rem',  // 24px
                    '3xl': '1.875rem', // 30px
                    '4xl': '2.25rem', // 36px
                    '5xl': '3rem'     // 48px
                },
                fontWeight: {
                    light: 300,
                    normal: 400,
                    medium: 500,
                    semibold: 600,
                    bold: 700
                },
                lineHeight: {
                    none: 1,
                    tight: 1.25,
                    snug: 1.375,
                    normal: 1.5,
                    relaxed: 1.625,
                    loose: 2
                }
            },
            spacing: {
                xs: '0.25rem',   // 4px
                sm: '0.5rem',    // 8px
                md: '1rem',      // 16px
                lg: '1.5rem',    // 24px
                xl: '2rem',      // 32px
                '2xl': '3rem',   // 48px
                '3xl': '4rem'    // 64px
            },
            borderRadius: {
                none: '0',
                sm: '0.125rem',   // 2px
                base: '0.25rem',  // 4px
                md: '0.375rem',   // 6px
                lg: '0.5rem',     // 8px
                xl: '0.75rem',    // 12px
                '2xl': '1rem',    // 16px
                '3xl': '1.5rem',  // 24px
                full: '9999px'
            },
            shadows: {
                none: 'none',
                sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            },
            animations: {
                transition: {
                    fast: '150ms',
                    base: '300ms',
                    slow: '500ms'
                },
                easing: {
                    linear: 'linear',
                    in: 'cubic-bezier(0.4, 0, 1, 1)',
                    out: 'cubic-bezier(0, 0, 0.2, 1)',
                    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }
            },
            components: {
                button: {
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    fontWeight: 500,
                    transition: 'all 150ms ease-in-out'
                },
                card: {
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    background: '#FFFFFF'
                },
                input: {
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.375rem',
                    borderWidth: '1px',
                    fontSize: '1rem'
                },
                navbar: {
                    height: '4rem',
                    background: '#2D5530',
                    color: '#FFFFFF'
                }
            }
        });
    } catch (error) {
        console.error('Get style config error:', error);
        return errorResponse('Failed to fetch style configuration', 500);
    }
}

async function updateStyleConfig(request, env) {
    try {
        const body = await request.json();
        
        // Validate config structure
        if (!body.colors || !body.typography || !body.spacing) {
            return errorResponse('Invalid configuration structure', 400);
        }

        // Save to KV if available
        if (env.CACHE) {
            await env.CACHE.put('style_config', JSON.stringify(body), {
                expirationTtl: 86400 * 30 // 30 days
            });
        }

        // Generate CSS from config
        const css = generateCSS(body);
        
        return successResponse({
            message: 'Style configuration updated successfully',
            config: body,
            generated_css: css
        });
    } catch (error) {
        console.error('Update style config error:', error);
        return errorResponse('Failed to update style configuration', 500);
    }
}

async function getThemes(request, env) {
    try {
        return successResponse([
            {
                id: 'default',
                name: 'Hunta Classic',
                description: 'The original Hunta theme with forest green and earthy tones',
                preview: {
                    primary: '#2D5530',
                    secondary: '#D97706',
                    background: '#F9FAFB'
                }
            },
            {
                id: 'midnight',
                name: 'Midnight Hunter',
                description: 'Dark theme for night hunting preparation',
                preview: {
                    primary: '#1e3a8a',
                    secondary: '#f59e0b',
                    background: '#0f172a'
                }
            },
            {
                id: 'autumn',
                name: 'Autumn Woods',
                description: 'Warm autumn colors inspired by fall hunting season',
                preview: {
                    primary: '#92400e',
                    secondary: '#ea580c',
                    background: '#fef3c7'
                }
            },
            {
                id: 'winter',
                name: 'Winter Field',
                description: 'Cool blues and whites for winter hunting',
                preview: {
                    primary: '#1e40af',
                    secondary: '#7c3aed',
                    background: '#f0f9ff'
                }
            }
        ]);
    } catch (error) {
        console.error('Get themes error:', error);
        return errorResponse('Failed to fetch themes', 500);
    }
}

async function createTheme(request, env) {
    try {
        const body = await request.json();
        const { name, description, config } = body;

        if (!name || !config) {
            return errorResponse('Name and configuration required', 400);
        }

        // Generate theme ID
        const themeId = name.toLowerCase().replace(/\s+/g, '-');

        // Save theme if KV available
        if (env.CACHE) {
            const themes = await env.CACHE.get('custom_themes', 'json') || [];
            themes.push({
                id: themeId,
                name,
                description,
                config,
                created_at: new Date().toISOString()
            });
            await env.CACHE.put('custom_themes', JSON.stringify(themes));
        }

        return successResponse({
            message: 'Theme created successfully',
            theme: {
                id: themeId,
                name,
                description,
                config
            }
        });
    } catch (error) {
        console.error('Create theme error:', error);
        return errorResponse('Failed to create theme', 500);
    }
}

async function previewStyles(request, env) {
    try {
        const body = await request.json();
        const { config } = body;

        if (!config) {
            return errorResponse('Configuration required for preview', 400);
        }

        // Generate preview CSS
        const css = generateCSS(config);
        
        // Generate preview HTML
        const html = generatePreviewHTML(config);

        return successResponse({
            css,
            html,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Preview styles error:', error);
        return errorResponse('Failed to generate preview', 500);
    }
}

async function exportStyles(request, env) {
    try {
        const url = new URL(request.url);
        const format = url.searchParams.get('format') || 'css';

        // Get current config
        let config;
        if (env.CACHE) {
            config = await env.CACHE.get('style_config', 'json');
        } else {
            // Use default config
            const defaultResponse = await getStyleConfig(request, env);
            const defaultData = await defaultResponse.json();
            config = defaultData.data;
        }

        let output;
        let contentType;
        
        switch (format) {
            case 'css':
                output = generateCSS(config);
                contentType = 'text/css';
                break;
            case 'json':
                output = JSON.stringify(config, null, 2);
                contentType = 'application/json';
                break;
            case 'scss':
                output = generateSCSS(config);
                contentType = 'text/x-scss';
                break;
            case 'tailwind':
                output = generateTailwindConfig(config);
                contentType = 'application/javascript';
                break;
            default:
                return errorResponse('Invalid export format', 400);
        }

        return new Response(output, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="hunta-styles.${format}"`
            }
        });
    } catch (error) {
        console.error('Export styles error:', error);
        return errorResponse('Failed to export styles', 500);
    }
}

// Helper functions
function generateCSS(config) {
    const { colors, typography, spacing, borderRadius, shadows } = config;
    
    let css = ':root {\n';
    
    // Colors
    Object.entries(colors).forEach(([key, color]) => {
        css += `  --color-${camelToKebab(key)}: ${color.value};\n`;
        css += `  --color-${camelToKebab(key)}-rgb: ${color.rgb};\n`;
    });
    
    // Typography
    css += '\n  /* Typography */\n';
    Object.entries(typography.fontSize).forEach(([key, value]) => {
        css += `  --font-size-${key}: ${value};\n`;
    });
    
    // Spacing
    css += '\n  /* Spacing */\n';
    Object.entries(spacing).forEach(([key, value]) => {
        css += `  --spacing-${key}: ${value};\n`;
    });
    
    // Border Radius
    css += '\n  /* Border Radius */\n';
    Object.entries(borderRadius).forEach(([key, value]) => {
        css += `  --radius-${key}: ${value};\n`;
    });
    
    css += '}\n\n';
    
    // Component styles
    css += generateComponentStyles(config);
    
    return css;
}

function generateComponentStyles(config) {
    const { colors, components } = config;
    
    return `
/* Button Styles */
.btn-primary {
  background-color: var(--color-primary);
  color: white;
  padding: ${components.button.padding};
  border-radius: ${components.button.borderRadius};
  font-weight: ${components.button.fontWeight};
  transition: ${components.button.transition};
}

.btn-primary:hover {
  background-color: var(--color-primary-light);
}

/* Card Styles */
.card {
  background: ${components.card.background};
  padding: ${components.card.padding};
  border-radius: ${components.card.borderRadius};
  box-shadow: ${components.card.boxShadow};
}

/* Input Styles */
.input {
  padding: ${components.input.padding};
  border-radius: ${components.input.borderRadius};
  border: ${components.input.borderWidth} solid var(--color-border);
  font-size: ${components.input.fontSize};
}

/* Navbar Styles */
.navbar {
  height: ${components.navbar.height};
  background: ${components.navbar.background};
  color: ${components.navbar.color};
}
`;
}

function generateSCSS(config) {
    const { colors, typography, spacing } = config;
    
    let scss = '// Hunta SCSS Variables\n\n';
    
    // Colors
    scss += '// Colors\n';
    Object.entries(colors).forEach(([key, color]) => {
        scss += `$${camelToKebab(key)}: ${color.value};\n`;
    });
    
    // Typography
    scss += '\n// Typography\n';
    Object.entries(typography.fontSize).forEach(([key, value]) => {
        scss += `$font-size-${key}: ${value};\n`;
    });
    
    return scss;
}

function generateTailwindConfig(config) {
    const { colors, typography, spacing } = config;
    
    return `module.exports = {
  theme: {
    extend: {
      colors: {
        hunta: {
          green: '${colors.primary.value}',
          'green-light': '${colors.primaryLight.value}',
          orange: '${colors.secondary.value}',
        }
      },
      fontFamily: {
        sans: ${typography.fontFamily.primary},
      }
    }
  }
}`;
}

function generatePreviewHTML(config) {
    return `
<div class="preview-container" style="padding: 2rem;">
  <h2>Style Preview</h2>
  
  <div class="colors" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 2rem 0;">
    ${Object.entries(config.colors).map(([key, color]) => `
      <div style="text-align: center;">
        <div style="width: 100px; height: 100px; background: ${color.value}; border-radius: 8px; margin: 0 auto;"></div>
        <p style="margin-top: 0.5rem; font-weight: 500;">${color.name}</p>
        <p style="font-size: 0.875rem; color: #666;">${color.value}</p>
      </div>
    `).join('')}
  </div>
  
  <div class="components" style="margin: 2rem 0;">
    <h3>Components</h3>
    <button class="btn-primary">Primary Button</button>
    <div class="card" style="margin: 1rem 0;">
      <h4>Card Component</h4>
      <p>This is a card with the current styling applied.</p>
    </div>
    <input class="input" placeholder="Input field" style="display: block; margin: 1rem 0;">
  </div>
</div>
`;
}

function camelToKebab(str) {
    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function successResponse(data, message) {
    return new Response(JSON.stringify({
        success: true,
        data,
        message: message || undefined
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

function errorResponse(message, status = 500) {
    return new Response(JSON.stringify({
        success: false,
        error: message
    }), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}