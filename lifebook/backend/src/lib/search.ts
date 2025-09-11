import { Client } from '@elastic/elasticsearch';
import { createLogger } from 'winston';

const logger = createLogger({
  level: 'info',
  format: require('winston').format.combine(
    require('winston').format.timestamp(),
    require('winston').format.errors({ stack: true }),
    require('winston').format.json()
  ),
  defaultMeta: { service: 'search' },
  transports: [
    new (require('winston').transports.Console)({
      format: require('winston').format.simple()
    })
  ]
});

export interface SearchConfig {
  node: string;
  auth?: {
    username: string;
    password: string;
  };
  ssl?: {
    ca?: string;
    rejectUnauthorized?: boolean;
  };
}

export interface DocumentSearchResult {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  highlights: string[];
  score: number;
  metadata: any;
}

export interface SearchResponse {
  total: number;
  results: DocumentSearchResult[];
  aggregations?: any;
  took: number;
}

class SearchConnection {
  private static instance: SearchConnection;
  private client: Client;
  private readonly documentsIndex = 'documents';
  private readonly sectionsIndex = 'document_sections';

  private constructor() {
    const config: SearchConfig = {
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    };

    if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
      config.auth = {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      };
    }

    this.client = new Client(config);
    logger.info('Elasticsearch client initialized');
  }

  public static getInstance(): SearchConnection {
    if (!SearchConnection.instance) {
      SearchConnection.instance = new SearchConnection();
    }
    return SearchConnection.instance;
  }

  public getClient(): Client {
    return this.client;
  }

  public async ensureIndices(): Promise<void> {
    try {
      await this.createDocumentsIndex();
      await this.createSectionsIndex();
      logger.info('Elasticsearch indices ensured');
    } catch (error) {
      logger.error('Failed to ensure indices', { error });
      throw error;
    }
  }

  private async createDocumentsIndex(): Promise<void> {
    const exists = await this.client.indices.exists({
      index: this.documentsIndex
    });

    if (!exists) {
      await this.client.indices.create({
        index: this.documentsIndex,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                technical_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: [
                    'lowercase',
                    'stop',
                    'snowball',
                    'technical_synonym'
                  ]
                }
              },
              filter: {
                technical_synonym: {
                  type: 'synonym',
                  synonyms: [
                    'api,application programming interface',
                    'db,database',
                    'auth,authentication',
                    'ui,user interface,frontend',
                    'backend,server,api'
                  ]
                }
              }
            }
          },
          mappings: {
            properties: {
              title: {
                type: 'text',
                analyzer: 'technical_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              content: {
                type: 'text',
                analyzer: 'technical_analyzer'
              },
              wordCount: { type: 'integer' },
              status: { type: 'keyword' },
              version: { type: 'keyword' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
              createdBy: { type: 'keyword' },
              ownerId: { type: 'keyword' },
              metadata: {
                type: 'object',
                dynamic: true
              },
              tags: { type: 'keyword' }
            }
          }
        }
      });
      logger.info('Documents index created');
    }
  }

  private async createSectionsIndex(): Promise<void> {
    const exists = await this.client.indices.exists({
      index: this.sectionsIndex
    });

    if (!exists) {
      await this.client.indices.create({
        index: this.sectionsIndex,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                technical_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop', 'snowball']
                }
              }
            }
          },
          mappings: {
            properties: {
              documentId: { type: 'keyword' },
              title: {
                type: 'text',
                analyzer: 'technical_analyzer',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              content: {
                type: 'text',
                analyzer: 'technical_analyzer'
              },
              level: { type: 'integer' },
              order: { type: 'integer' },
              wordCount: { type: 'integer' },
              parentId: { type: 'keyword' },
              path: { type: 'keyword' }
            }
          }
        }
      });
      logger.info('Sections index created');
    }
  }

  public async indexDocument(documentId: string, document: any): Promise<void> {
    try {
      await this.client.index({
        index: this.documentsIndex,
        id: documentId,
        body: {
          title: document.title,
          content: this.extractTextContent(document.content),
          wordCount: document.wordCount,
          status: document.status,
          version: document.version,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          createdBy: document.createdBy,
          ownerId: document.ownerId,
          metadata: document.metadata,
          tags: document.metadata?.tags || []
        }
      });

      // Index sections separately for better searchability
      if (document.sections) {
        await this.indexDocumentSections(documentId, document.sections);
      }

      logger.debug('Document indexed', { documentId });
    } catch (error) {
      logger.error('Failed to index document', { documentId, error });
      throw error;
    }
  }

  private async indexDocumentSections(documentId: string, sections: any[]): Promise<void> {
    const bulkBody: any[] = [];

    sections.forEach(section => {
      bulkBody.push(
        { index: { _index: this.sectionsIndex, _id: `${documentId}_${section.id}` } },
        {
          documentId,
          title: section.title,
          content: section.content,
          level: section.level,
          order: section.order,
          wordCount: section.wordCount,
          parentId: section.parentId,
          path: this.buildSectionPath(section)
        }
      );
    });

    if (bulkBody.length > 0) {
      await this.client.bulk({ body: bulkBody });
    }
  }

  private extractTextContent(content: any): string {
    if (typeof content === 'string') return content;
    if (content?.sections) {
      return content.sections.map((s: any) => `${s.title} ${s.content}`).join(' ');
    }
    return JSON.stringify(content);
  }

  private buildSectionPath(section: any): string {
    // Build hierarchical path for section (e.g., "1.2.3")
    return section.path || section.order?.toString() || '';
  }

  public async searchDocuments(query: string, filters: any = {}, options: any = {}): Promise<SearchResponse> {
    try {
      const searchBody: any = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['title^3', 'content'],
                  type: 'best_fields',
                  fuzziness: 'AUTO'
                }
              }
            ],
            filter: []
          }
        },
        highlight: {
          fields: {
            title: { fragment_size: 100, number_of_fragments: 1 },
            content: { fragment_size: 150, number_of_fragments: 3 }
          }
        },
        size: options.size || 20,
        from: options.from || 0,
        sort: options.sort || [{ _score: 'desc' }, { updatedAt: 'desc' }]
      };

      // Apply filters
      if (filters.status) {
        searchBody.query.bool.filter.push({ term: { status: filters.status } });
      }
      if (filters.ownerId) {
        searchBody.query.bool.filter.push({ term: { ownerId: filters.ownerId } });
      }
      if (filters.wordCount) {
        searchBody.query.bool.filter.push({ range: { wordCount: filters.wordCount } });
      }

      const response = await this.client.search({
        index: this.documentsIndex,
        body: searchBody
      });

      const results: DocumentSearchResult[] = response.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        title: hit._source.title,
        content: hit._source.content,
        wordCount: hit._source.wordCount,
        highlights: this.extractHighlights(hit.highlight),
        score: hit._score,
        metadata: hit._source.metadata
      }));

      return {
        total: response.body.hits.total.value,
        results,
        aggregations: response.body.aggregations,
        took: response.body.took
      };

    } catch (error) {
      logger.error('Search failed', { query, error });
      throw error;
    }
  }

  private extractHighlights(highlight: any): string[] {
    if (!highlight) return [];
    const highlights: string[] = [];
    
    if (highlight.title) {
      highlights.push(...highlight.title);
    }
    if (highlight.content) {
      highlights.push(...highlight.content);
    }
    
    return highlights;
  }

  public async deleteDocument(documentId: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.documentsIndex,
        id: documentId
      });

      // Delete associated sections
      await this.client.deleteByQuery({
        index: this.sectionsIndex,
        body: {
          query: {
            term: { documentId }
          }
        }
      });

      logger.debug('Document deleted from search index', { documentId });
    } catch (error) {
      logger.error('Failed to delete document from search index', { documentId, error });
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.cluster.health();
      return response.body.status !== 'red';
    } catch (error) {
      logger.error('Elasticsearch health check failed', { error });
      return false;
    }
  }
}

export const search = SearchConnection.getInstance();