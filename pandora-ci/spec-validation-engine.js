#!/usr/bin/env node

/**
 * PANDORA SPECIFICATION VALIDATION ENGINE
 *
 * Core component of Continuous AI pipeline that validates specifications
 * and routes them to appropriate AI agents for implementation.
 *
 * This runs as scheduled job (cron) and webhook handler.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const crypto = require('crypto');
const { Pool } = require('pg');

class SpecValidationEngine {
    constructor(config) {
        this.config = config;
        // Load environment variables
        require('dotenv').config({ path: '.env.production' });

        this.db = new Pool({
            host: process.env.DB_HOST || '10.90.10.6',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'openproject_db',
            user: process.env.DB_USER || 'openproject',
            password: process.env.DB_PASSWORD
        });

        this.aiAgents = {
            'claude-code': {
                specialties: ['frontend', 'api', 'documentation', 'testing'],
                languages: ['typescript', 'react', 'node.js', 'javascript'],
                endpoint: process.env.CLAUDE_CODE_ENDPOINT
            },
            'qwen': {
                specialties: ['backend', 'database', 'algorithms', 'optimization'],
                languages: ['python', 'go', 'sql', 'rust', 'java'],
                endpoint: process.env.QWEN_ENDPOINT
            }
        };
    }

    /**
     * Main entry point - monitors specs and triggers AI generation
     */
    async processSpecifications() {
        console.log('🔍 Starting specification validation cycle...');

        try {
            const specFiles = await this.discoverSpecFiles();
            console.log(`📋 Found ${specFiles.length} specification files`);

            for (const specFile of specFiles) {
                await this.processSpecFile(specFile);
            }

            console.log('✅ Specification validation cycle completed');
        } catch (error) {
            console.error('❌ Specification validation failed:', error);
            await this.logError('spec_validation_cycle', error);
        }
    }

    /**
     * Discover all specification files in the project
     */
    async discoverSpecFiles() {
        const specDirs = [
            'specs/functional',
            'specs/technical',
            'specs/quality',
            'specs/ui',
            'docs/specs',
            'api/specs'
        ];

        let specFiles = [];

        for (const dir of specDirs) {
            if (fs.existsSync(dir)) {
                const files = this.getAllFiles(dir)
                    .filter(file => this.isSpecFile(file));
                specFiles = specFiles.concat(files);
            }
        }

        return specFiles;
    }

    /**
     * Recursively get all files in directory
     */
    getAllFiles(dirPath, arrayOfFiles = []) {
        const files = fs.readdirSync(dirPath);

        files.forEach(file => {
            if (fs.statSync(dirPath + "/" + file).isDirectory()) {
                arrayOfFiles = this.getAllFiles(dirPath + "/" + file, arrayOfFiles);
            } else {
                arrayOfFiles.push(path.join(dirPath, file));
            }
        });

        return arrayOfFiles;
    }

    /**
     * Check if file is a specification file
     */
    isSpecFile(filePath) {
        const specExtensions = ['.yaml', '.yml', '.json', '.openapi', '.swagger', '.md'];
        const specKeywords = ['spec', 'requirement', 'story', 'acceptance', 'api'];

        const ext = path.extname(filePath);
        const name = path.basename(filePath, ext).toLowerCase();

        return specExtensions.includes(ext) &&
               specKeywords.some(keyword => name.includes(keyword));
    }

    /**
     * Process individual specification file
     */
    async processSpecFile(filePath) {
        console.log(`📄 Processing spec: ${filePath}`);

        try {
            // Read and parse spec
            const content = fs.readFileSync(filePath, 'utf8');
            const spec = await this.parseSpecContent(content, filePath);

            // Calculate hash for change detection
            const specHash = crypto.createHash('sha256').update(content).digest('hex');

            // Check if spec has changed
            const existingSpec = await this.getExistingSpec(filePath);
            if (existingSpec && existingSpec.spec_hash === specHash) {
                console.log(`⏭️  Spec unchanged: ${filePath}`);
                return;
            }

            // Validate specification
            const validation = await this.validateSpecification(spec, filePath);
            if (!validation.valid) {
                console.error(`❌ Invalid spec: ${filePath}`, validation.errors);
                await this.updateSpecStatus(filePath, 'invalid', validation.errors);
                return;
            }

            // Determine AI agent assignment
            const aiAgent = this.assignAIAgent(spec);

            // Save or update spec in database
            await this.saveSpecification({
                filePath,
                specHash,
                content: spec,
                aiAgent,
                status: 'pending_implementation'
            });

            // Trigger AI code generation
            await this.triggerAIGeneration(filePath, spec, aiAgent);

            console.log(`✅ Spec processed: ${filePath} → ${aiAgent}`);

        } catch (error) {
            console.error(`❌ Failed to process spec: ${filePath}`, error);
            await this.updateSpecStatus(filePath, 'processing_failed', error.message);
        }
    }

    /**
     * Parse specification content based on file type
     */
    async parseSpecContent(content, filePath) {
        const ext = path.extname(filePath);

        switch (ext) {
            case '.yaml':
            case '.yml':
                return yaml.load(content);

            case '.json':
            case '.openapi':
            case '.swagger':
                return JSON.parse(content);

            case '.md':
                return this.parseMarkdownSpec(content);

            default:
                return { raw: content, type: 'unknown' };
        }
    }

    /**
     * Parse markdown specification into structured format
     */
    parseMarkdownSpec(content) {
        const sections = {};
        const lines = content.split('\n');
        let currentSection = 'overview';
        let currentContent = [];

        for (const line of lines) {
            if (line.startsWith('#')) {
                // Save previous section
                if (currentContent.length > 0) {
                    sections[currentSection] = currentContent.join('\n');
                }

                // Start new section
                currentSection = line.replace(/^#+\s*/, '').toLowerCase()
                    .replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
                currentContent = [];
            } else {
                currentContent.push(line);
            }
        }

        // Save final section
        if (currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n');
        }

        return {
            type: 'markdown',
            sections,
            raw: content
        };
    }

    /**
     * Validate specification completeness and correctness
     */
    async validateSpecification(spec, filePath) {
        const validation = {
            valid: true,
            errors: [],
            warnings: []
        };

        // Required fields check
        const requiredFields = this.getRequiredFields(spec);
        for (const field of requiredFields) {
            if (!this.hasField(spec, field)) {
                validation.errors.push(`Missing required field: ${field}`);
                validation.valid = false;
            }
        }

        // Type-specific validation
        if (spec.type) {
            switch (spec.type) {
                case 'api':
                    this.validateAPISpec(spec, validation);
                    break;
                case 'database':
                    this.validateDatabaseSpec(spec, validation);
                    break;
                case 'ui':
                    this.validateUISpec(spec, validation);
                    break;
                case 'functional':
                    this.validateFunctionalSpec(spec, validation);
                    break;
            }
        }

        // Cross-reference validation
        await this.validateCrossReferences(spec, validation);

        return validation;
    }

    /**
     * Validate API specification
     */
    validateAPISpec(spec, validation) {
        const requiredApiFields = ['endpoints', 'methods', 'request_format', 'response_format'];

        for (const field of requiredApiFields) {
            if (!spec[field]) {
                validation.errors.push(`API spec missing: ${field}`);
                validation.valid = false;
            }
        }

        // Validate endpoint definitions
        if (spec.endpoints) {
            for (const endpoint of spec.endpoints) {
                if (!endpoint.path || !endpoint.method) {
                    validation.errors.push(`Incomplete endpoint definition: ${JSON.stringify(endpoint)}`);
                    validation.valid = false;
                }
            }
        }
    }

    /**
     * Validate database specification
     */
    validateDatabaseSpec(spec, validation) {
        if (spec.tables) {
            for (const table of spec.tables) {
                if (!table.name || !table.columns) {
                    validation.errors.push(`Incomplete table definition: ${JSON.stringify(table)}`);
                    validation.valid = false;
                }
            }
        }
    }

    /**
     * Validate UI specification
     */
    validateUISpec(spec, validation) {
        const requiredUIFields = ['components', 'layouts', 'user_flows'];

        for (const field of requiredUIFields) {
            if (!spec[field]) {
                validation.warnings.push(`UI spec missing recommended field: ${field}`);
            }
        }
    }

    /**
     * Validate functional specification
     */
    validateFunctionalSpec(spec, validation) {
        const requiredFuncFields = ['user_stories', 'acceptance_criteria'];

        for (const field of requiredFuncFields) {
            if (!spec[field]) {
                validation.errors.push(`Functional spec missing: ${field}`);
                validation.valid = false;
            }
        }
    }

    /**
     * Assign appropriate AI agent based on specification type and content
     */
    assignAIAgent(spec) {
        // Default assignment logic
        if (spec.type === 'api' || spec.type === 'ui' || spec.language === 'typescript') {
            return 'claude-code';
        }

        if (spec.type === 'database' || spec.type === 'backend' || spec.language === 'python') {
            return 'qwen';
        }

        // Intelligent assignment based on content analysis
        const content = JSON.stringify(spec).toLowerCase();

        const claudeKeywords = ['frontend', 'react', 'ui', 'component', 'typescript', 'javascript'];
        const qwenKeywords = ['backend', 'database', 'algorithm', 'performance', 'python', 'go'];

        const claudeScore = claudeKeywords.filter(kw => content.includes(kw)).length;
        const qwenScore = qwenKeywords.filter(kw => content.includes(kw)).length;

        return claudeScore > qwenScore ? 'claude-code' : 'qwen';
    }

    /**
     * Trigger AI code generation via n8n webhook
     */
    async triggerAIGeneration(specPath, spec, aiAgent) {
        const payload = {
            trigger_type: 'spec_implementation',
            spec_path: specPath,
            spec_content: spec,
            ai_agent: aiAgent,
            project_name: this.extractProjectName(specPath),
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch(`${process.env.N8N_URL}/webhook/ai-code-generation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${Buffer.from(`${process.env.N8N_BASIC_AUTH_USER}:${process.env.N8N_BASIC_AUTH_PASSWORD}`).toString('base64')}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`n8n webhook failed: ${response.status}`);
            }

            console.log(`🚀 AI generation triggered: ${specPath} → ${aiAgent}`);

        } catch (error) {
            console.error('❌ Failed to trigger AI generation:', error);
            await this.updateSpecStatus(specPath, 'ai_trigger_failed', error.message);
        }
    }

    /**
     * Database operations
     */
    async getExistingSpec(filePath) {
        try {
            const result = await this.db.query(
                'SELECT * FROM cicd.specs WHERE file_path = $1 ORDER BY created_at DESC LIMIT 1',
                [filePath]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.log('Database connection issue, skipping existing spec check:', error.message);
            return null;
        }
    }

    async saveSpecification(specData) {
        const query = `
            INSERT INTO specs (
                file_path, spec_hash, content, ai_agent_assigned,
                implementation_status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            ON CONFLICT (file_path)
            DO UPDATE SET
                spec_hash = $2,
                content = $3,
                ai_agent_assigned = $4,
                implementation_status = $5,
                updated_at = NOW()
        `;

        await this.db.query(query, [
            specData.filePath,
            specData.specHash,
            JSON.stringify(specData.content),
            specData.aiAgent,
            specData.status
        ]);
    }

    async updateSpecStatus(filePath, status, errorMessage = null) {
        try {
            await this.db.query(
                'UPDATE cicd.specs SET implementation_status = $1, error_message = $2, updated_at = NOW() WHERE file_path = $3',
                [status, errorMessage, filePath]
            );
        } catch (error) {
            console.log('Database connection issue, skipping status update:', error.message);
        }
    }

    async logError(component, error) {
        await this.db.query(
            'INSERT INTO error_log (component, error_message, occurred_at) VALUES ($1, $2, NOW())',
            [component, error.message || error.toString()]
        );
    }

    /**
     * Utility methods
     */
    getRequiredFields(spec) {
        const baseFields = ['title', 'description', 'version'];

        if (spec.type === 'api') {
            return [...baseFields, 'endpoints'];
        }
        if (spec.type === 'database') {
            return [...baseFields, 'tables'];
        }
        if (spec.type === 'functional') {
            return [...baseFields, 'user_stories'];
        }

        return baseFields;
    }

    hasField(obj, field) {
        return field.split('.').reduce((o, f) => o && o[f], obj) !== undefined;
    }

    extractProjectName(filePath) {
        const parts = filePath.split('/');
        return parts.find(p => !['specs', 'functional', 'technical', 'quality', 'ui'].includes(p)) || 'unknown';
    }

    async validateCrossReferences(spec, validation) {
        // Check if referenced specs exist
        if (spec.references) {
            for (const ref of spec.references) {
                const exists = await this.db.query(
                    'SELECT id FROM specs WHERE file_path = $1',
                    [ref]
                );
                if (exists.rows.length === 0) {
                    validation.warnings.push(`Referenced spec not found: ${ref}`);
                }
            }
        }
    }
}

// CLI interface
if (require.main === module) {
    const engine = new SpecValidationEngine();

    const command = process.argv[2] || 'process';

    switch (command) {
        case 'process':
            engine.processSpecifications();
            break;
        case 'validate':
            const specFile = process.argv[3];
            if (specFile) {
                engine.processSpecFile(specFile);
            } else {
                console.error('Usage: spec-validation-engine.js validate <spec-file>');
            }
            break;
        default:
            console.log('Available commands: process, validate <file>');
    }
}

module.exports = SpecValidationEngine;