/**
 * Simple Router for Cloudflare Workers
 * Handles HTTP routing with middleware support
 */

export class Router {
    constructor() {
        this.routes = {
            GET: new Map(),
            POST: new Map(),
            PUT: new Map(),
            DELETE: new Map(),
            OPTIONS: new Map()
        };
    }

    // Route registration methods
    get(path, ...handlers) {
        this.routes.GET.set(path, handlers);
    }

    post(path, ...handlers) {
        this.routes.POST.set(path, handlers);
    }

    put(path, ...handlers) {
        this.routes.PUT.set(path, handlers);
    }

    delete(path, ...handlers) {
        this.routes.DELETE.set(path, handlers);
    }

    options(path, ...handlers) {
        this.routes.OPTIONS.set(path, handlers);
    }

    // Pattern matching for dynamic routes
    matchRoute(pattern, path) {
        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length !== pathParts.length && !pattern.includes('*')) {
            return null;
        }

        const params = {};
        
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];

            if (patternPart === '*') {
                // Wildcard matches everything
                return { params };
            } else if (patternPart.startsWith(':')) {
                // Dynamic parameter
                const paramName = patternPart.substring(1);
                params[paramName] = pathPart;
            } else if (patternPart !== pathPart) {
                // Exact match required
                return null;
            }
        }

        return { params };
    }

    // Find matching route
    findRoute(method, path) {
        const methodRoutes = this.routes[method];
        if (!methodRoutes) return null;

        // Try exact match first
        if (methodRoutes.has(path)) {
            return {
                handlers: methodRoutes.get(path),
                params: {}
            };
        }

        // Try pattern matching
        for (const [pattern, handlers] of methodRoutes) {
            const match = this.matchRoute(pattern, path);
            if (match) {
                return {
                    handlers,
                    params: match.params
                };
            }
        }

        return null;
    }

    // Handle incoming request
    async handle(request, env, ctx) {
        const url = new URL(request.url);
        const method = request.method;
        const path = url.pathname;

        const route = this.findRoute(method, path);
        
        if (!route) {
            return new Response('Not Found', { status: 404 });
        }

        // Add route params to request
        request.params = route.params;
        request.query = Object.fromEntries(url.searchParams);

        // Execute middleware chain
        for (const handler of route.handlers) {
            const result = await handler(request, env, ctx);
            
            // If middleware returns a Response, return it
            if (result instanceof Response) {
                return result;
            }
            
            // If middleware returns null/undefined, continue to next
            // Any other return value stops the chain
            if (result !== null && result !== undefined) {
                break;
            }
        }

        // If we get here, no handler returned a response
        return new Response('Internal Server Error', { status: 500 });
    }
}