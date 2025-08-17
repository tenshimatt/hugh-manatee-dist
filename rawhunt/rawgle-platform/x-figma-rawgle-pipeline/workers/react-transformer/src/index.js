// react-transformer.js - Convert Figma components to React
export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { templateId, components } = await request.json();
      
      // Transform each Figma component to React
      const reactComponents = await Promise.all(
        components.map(component => this.transformComponent(component, env))
      );

      // Generate index file
      const indexFile = this.generateIndexFile(reactComponents);
      
      // Store transformed components in KV
      await env.REACT_COMPONENTS.put(
        `template:${templateId}`, 
        JSON.stringify({ components: reactComponents, index: indexFile })
      );

      return new Response(JSON.stringify({
        success: true,
        templateId,
        components: reactComponents,
        indexFile,
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },

  async transformComponent(figmaComponent, env) {
    // Use OpenAI to intelligently transform Figma component to React
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{
          role: 'system',
          content: `You are a React component generator. Convert Figma design data to production-ready React components using Tailwind CSS. 
          
          Rules:
          - Use TypeScript interfaces for props
          - Include accessibility attributes
          - Use semantic HTML
          - Optimize for mobile-first responsive design
          - Include hover/focus states
          - Use Tailwind utility classes only
          - Export as named component
          - Include JSDoc comments`
        }, {
          role: 'user',
          content: `Transform this Figma component to React:
          
          Component: ${figmaComponent.name}
          Type: ${figmaComponent.type}
          Properties: ${JSON.stringify(figmaComponent.properties, null, 2)}
          Constraints: ${JSON.stringify(figmaComponent.constraints, null, 2)}
          Styles: ${JSON.stringify(figmaComponent.styles, null, 2)}
          Children: ${JSON.stringify(figmaComponent.children, null, 2)}`
        }],
        max_tokens: 2000,
        temperature: 0.1
      })
    });

    const gptResult = await gptResponse.json();
    const reactCode = gptResult.choices[0].message.content;

    return {
      name: figmaComponent.name,
      filename: `${this.toPascalCase(figmaComponent.name)}.tsx`,
      code: reactCode,
      props: this.extractProps(figmaComponent),
      dependencies: this.extractDependencies(reactCode),
      figmaId: figmaComponent.id
    };
  },

  generateIndexFile(components) {
    const imports = components
      .map(comp => `export { ${this.toPascalCase(comp.name)} } from './${comp.filename.replace('.tsx', '')}';`)
      .join('\n');

    const manifest = {
      components: components.map(comp => ({
        name: comp.name,
        filename: comp.filename,
        props: comp.props,
        dependencies: comp.dependencies
      })),
      generatedAt: new Date().toISOString(),
      totalComponents: components.length
    };

    return {
      indexTs: imports,
      manifest: manifest
    };
  },

  extractProps(figmaComponent) {
    // Extract component props from Figma component properties
    const props = {};
    
    if (figmaComponent.componentPropertyDefinitions) {
      Object.entries(figmaComponent.componentPropertyDefinitions).forEach(([key, prop]) => {
        props[key] = {
          type: this.mapFigmaTypeToReact(prop.type),
          required: !prop.defaultValue,
          default: prop.defaultValue
        };
      });
    }

    return props;
  },

  extractDependencies(reactCode) {
    const deps = new Set();
    
    // Check for common React patterns
    if (reactCode.includes('useState')) deps.add('react');
    if (reactCode.includes('useEffect')) deps.add('react');
    if (reactCode.includes('clsx') || reactCode.includes('cn(')) deps.add('clsx');
    if (reactCode.includes('lucide-react')) deps.add('lucide-react');
    
    return Array.from(deps);
  },

  mapFigmaTypeToReact(figmaType) {
    const typeMap = {
      'BOOLEAN': 'boolean',
      'TEXT': 'string',
      'INSTANCE_SWAP': 'React.ComponentType',
      'VARIANT': 'string'
    };
    return typeMap[figmaType] || 'any';
  },

  toPascalCase(str) {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^./, char => char.toUpperCase());
  }
};
