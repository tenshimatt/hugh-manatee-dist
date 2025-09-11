import { Client as ElasticsearchClient, RequestParams } from '@elastic/elasticsearch';
import { PrismaClient } from '@prisma/client';
import DocumentModel from '../../models/document';
import SectionModel from '../../models/section';
import UserModel from '../../models/user';

export interface SearchServiceConfig {
  elasticsearch: {
    node: string;
    auth?: {
      username: string;
      password: string;
    };
    apiKey?: string;
    tls?: {
      rejectUnauthorized: boolean;
    };
  };
  indices: {
    documents: string;
    sections: string;
    users: string;
  };
}

export interface SearchQuery {
  query: string;
  filters?: {
    documentIds?: string[];
    authorIds?: string[];
    ownerIds?: string[];
    status?: string[];
    dateRange?: {
      from?: Date;
      to?: Date;
    };
    wordCountRange?: {
      min?: number;
      max?: number;
    };
    tags?: string[];
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  }[];
  pagination?: {
    page: number;
    size: number;
  };
  highlight?: {
    enabled: boolean;
    fragmentSize?: number;
    numberOfFragments?: number;
  };
}

export interface SearchResult {
  total: number;
  hits: SearchHit[];
  aggregations?: Record<string, any>;
  suggestions?: SearchSuggestion[];
  took: number; // milliseconds
}

export interface SearchHit {
  id: string;
  type: 'document' | 'section' | 'user';
  score: number;
  source: any;
  highlights?: Record<string, string[]>;
}

export interface SearchSuggestion {
  text: string;
  score: number;
  type: 'completion' | 'term' | 'phrase';
}

export interface IndexStats {
  documentsCount: number;
  sectionsCount: number;
  usersCount: number;
  totalSize: string;
  lastIndexed: Date;
}

export interface SearchAnalytics {
  totalSearches: number;
  averageResponseTime: number;
  topQueries: { query: string; count: number }[];
  popularFilters: Record<string, number>;
  noResultsQueries: string[];
}

export class SearchService {
  private client: ElasticsearchClient;
  private documentModel: DocumentModel;
  private sectionModel: SectionModel;
  private userModel: UserModel;
  private config: SearchServiceConfig;
  private searchAnalytics = new Map<string, number>();

  constructor(prisma: PrismaClient, config: SearchServiceConfig) {
    this.client = new ElasticsearchClient(config.elasticsearch);
    this.documentModel = new DocumentModel(prisma);
    this.sectionModel = new SectionModel(prisma);
    this.userModel = new UserModel(prisma);
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Create indices if they don't exist
    await this.createIndices();
    
    // Set up index mappings
    await this.setupMappings();
    
    // Initial indexing
    await this.reindexAll();
  }

  async search(searchQuery: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // Build Elasticsearch query
      const esQuery = this.buildElasticsearchQuery(searchQuery);
      
      // Execute search
      const response = await this.client.search(esQuery);
      
      // Process results
      const result = this.processSearchResponse(response);
      
      // Record analytics
      this.recordSearchAnalytics(searchQuery, result, Date.now() - startTime);
      
      return result;
    } catch (error) {
      console.error('Search error:', error);
      throw new Error('Search failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async searchDocuments(query: string, filters?: SearchQuery['filters'], options?: {
    page?: number;
    size?: number;
    sort?: SearchQuery['sort'];
  }): Promise<SearchResult> {
    return this.search({
      query,
      filters,
      sort: options?.sort || [{ field: '_score', order: 'desc' }],
      pagination: {
        page: options?.page || 1,
        size: options?.size || 20,
      },
      highlight: {
        enabled: true,
        fragmentSize: 200,
        numberOfFragments: 3,
      },
    });
  }

  async searchSections(query: string, documentId?: string, options?: {
    page?: number;
    size?: number;
  }): Promise<SearchResult> {
    const filters: SearchQuery['filters'] = {};
    if (documentId) {
      filters.documentIds = [documentId];
    }

    return this.search({
      query,
      filters,
      pagination: {
        page: options?.page || 1,
        size: options?.size || 50,
      },
      highlight: {
        enabled: true,
        fragmentSize: 150,
        numberOfFragments: 2,
      },
    });
  }

  async suggest(query: string, type: 'completion' | 'term' | 'phrase' = 'completion'): Promise<SearchSuggestion[]> {
    try {
      let suggestQuery: any;

      switch (type) {
        case 'completion':
          suggestQuery = {
            'title-suggest': {
              prefix: query,
              completion: {
                field: 'title.suggest',
                size: 10,
              },
            },
          };
          break;
        case 'term':
          suggestQuery = {
            'term-suggest': {
              text: query,
              term: {
                field: 'content',
                size: 5,
              },
            },
          };
          break;
        case 'phrase':
          suggestQuery = {
            'phrase-suggest': {
              text: query,
              phrase: {
                field: 'content',
                size: 3,
              },
            },
          };
          break;
      }

      const response = await this.client.search({
        index: [this.config.indices.documents, this.config.indices.sections],
        body: {
          suggest: suggestQuery,
        },
      });

      return this.processSuggestResponse(response, type);
    } catch (error) {
      console.error('Suggest error:', error);
      return [];
    }
  }

  async indexDocument(documentId: string): Promise<boolean> {
    try {
      const document = await this.documentModel.findById(documentId, {
        includeRelations: {
          createdBy: true,
          owner: true,
          sections: true,
        },
      });

      if (!document) {
        return false;
      }

      // Index document
      await this.client.index({
        index: this.config.indices.documents,
        id: document.id,
        body: {
          title: document.title,
          content: JSON.stringify(document.content),
          status: document.status,
          wordCount: document.wordCount,
          version: document.version,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          createdBy: {
            id: (document as any).createdBy?.id,
            name: (document as any).createdBy?.name,
          },
          owner: {
            id: (document as any).owner?.id,
            name: (document as any).owner?.name,
          },
          metadata: document.metadata,
          tags: this.extractTags(document.metadata),
        },
      });

      // Index sections
      const sections = await this.sectionModel.findByDocumentId(documentId);
      for (const section of sections) {
        await this.client.index({
          index: this.config.indices.sections,
          id: section.id,
          body: {
            documentId: section.documentId,
            title: section.title,
            content: section.content,
            level: section.level,
            order: section.order,
            parentId: section.parentId,
            wordCount: section.wordCount,
            metadata: section.metadata,
          },
        });
      }

      return true;
    } catch (error) {
      console.error('Indexing error:', error);
      return false;
    }
  }

  async removeFromIndex(documentId: string): Promise<boolean> {
    try {
      // Remove document
      await this.client.delete({
        index: this.config.indices.documents,
        id: documentId,
      }).catch(() => {}); // Ignore if not found

      // Remove sections
      await this.client.deleteByQuery({
        index: this.config.indices.sections,
        body: {
          query: {
            term: {
              documentId,
            },
          },
        },
      });

      return true;
    } catch (error) {
      console.error('Remove from index error:', error);
      return false;
    }
  }

  async reindexAll(): Promise<{ indexed: number; errors: number }> {
    let indexed = 0;
    let errors = 0;

    try {
      // Clear existing indices
      await this.clearIndices();

      // Index all documents
      const documents = await this.documentModel.findMany();
      
      for (const document of documents) {
        const success = await this.indexDocument(document.id);
        if (success) {
          indexed++;
        } else {
          errors++;
        }
      }

      // Index all users
      const users = await this.userModel.findMany();
      for (const user of users) {
        try {
          await this.client.index({
            index: this.config.indices.users,
            id: user.id,
            body: {
              name: user.name,
              email: user.email,
              role: user.role,
              isActive: user.isActive,
              createdAt: user.createdAt,
              lastActiveAt: user.lastActiveAt,
            },
          });
          indexed++;
        } catch (error) {
          errors++;
        }
      }

      // Refresh indices
      await this.client.indices.refresh({
        index: Object.values(this.config.indices),
      });

      return { indexed, errors };
    } catch (error) {
      console.error('Reindex error:', error);
      return { indexed, errors: errors + 1 };
    }
  }

  async getIndexStats(): Promise<IndexStats> {
    try {
      const [documentsStats, sectionsStats, usersStats] = await Promise.all([
        this.client.count({ index: this.config.indices.documents }),
        this.client.count({ index: this.config.indices.sections }),
        this.client.count({ index: this.config.indices.users }),
      ]);

      const indicesStats = await this.client.indices.stats({
        index: Object.values(this.config.indices),
      });

      const totalSize = Object.values(indicesStats.body.indices)
        .reduce((sum, index: any) => sum + (index.total.store.size_in_bytes || 0), 0);

      return {
        documentsCount: documentsStats.body.count,
        sectionsCount: sectionsStats.body.count,
        usersCount: usersStats.body.count,
        totalSize: this.formatBytes(totalSize),
        lastIndexed: new Date(),
      };
    } catch (error) {
      console.error('Index stats error:', error);
      return {
        documentsCount: 0,
        sectionsCount: 0,
        usersCount: 0,
        totalSize: '0 B',
        lastIndexed: new Date(),
      };
    }
  }

  async getSearchAnalytics(): Promise<SearchAnalytics> {
    // In production, you'd store this in a database or dedicated analytics service
    const totalSearches = Array.from(this.searchAnalytics.values()).reduce((sum, count) => sum + count, 0);
    
    const topQueries = Array.from(this.searchAnalytics.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSearches,
      averageResponseTime: 150, // Placeholder
      topQueries,
      popularFilters: {
        status: 45,
        author: 32,
        dateRange: 28,
        wordCount: 15,
      },
      noResultsQueries: ['complex technical query', 'specific jargon'],
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      const health = await this.client.cluster.health();
      const indicesExist = await this.checkIndicesExist();
      
      return {
        healthy: health.body.status !== 'red' && indicesExist,
        details: {
          clusterStatus: health.body.status,
          numberOfNodes: health.body.number_of_nodes,
          indicesExist,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        },
      };
    }
  }

  private async createIndices(): Promise<void> {
    const indices = Object.values(this.config.indices);
    
    for (const index of indices) {
      try {
        const exists = await this.client.indices.exists({ index });
        if (!exists.body) {
          await this.client.indices.create({
            index,
            body: {
              settings: {
                number_of_shards: 1,
                number_of_replicas: 0,
                analysis: {
                  analyzer: {
                    content_analyzer: {
                      type: 'custom',
                      tokenizer: 'standard',
                      filter: ['lowercase', 'stop', 'stemmer'],
                    },
                  },
                },
              },
            },
          });
        }
      } catch (error) {
        console.error(`Failed to create index ${index}:`, error);
      }
    }
  }

  private async setupMappings(): Promise<void> {
    // Document mapping
    await this.client.indices.putMapping({
      index: this.config.indices.documents,
      body: {
        properties: {
          title: {
            type: 'text',
            analyzer: 'content_analyzer',
            fields: {
              keyword: { type: 'keyword' },
              suggest: { type: 'completion' },
            },
          },
          content: {
            type: 'text',
            analyzer: 'content_analyzer',
          },
          status: { type: 'keyword' },
          wordCount: { type: 'integer' },
          version: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
          'createdBy.id': { type: 'keyword' },
          'createdBy.name': { type: 'text' },
          'owner.id': { type: 'keyword' },
          'owner.name': { type: 'text' },
          tags: { type: 'keyword' },
          metadata: { type: 'object' },
        },
      },
    });

    // Section mapping
    await this.client.indices.putMapping({
      index: this.config.indices.sections,
      body: {
        properties: {
          documentId: { type: 'keyword' },
          title: {
            type: 'text',
            analyzer: 'content_analyzer',
            fields: { keyword: { type: 'keyword' } },
          },
          content: {
            type: 'text',
            analyzer: 'content_analyzer',
          },
          level: { type: 'integer' },
          order: { type: 'integer' },
          parentId: { type: 'keyword' },
          wordCount: { type: 'integer' },
          metadata: { type: 'object' },
        },
      },
    });

    // User mapping
    await this.client.indices.putMapping({
      index: this.config.indices.users,
      body: {
        properties: {
          name: {
            type: 'text',
            analyzer: 'content_analyzer',
            fields: { keyword: { type: 'keyword' } },
          },
          email: { type: 'keyword' },
          role: { type: 'keyword' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'date' },
          lastActiveAt: { type: 'date' },
        },
      },
    });
  }

  private buildElasticsearchQuery(searchQuery: SearchQuery): RequestParams.Search {
    const { query, filters, sort, pagination, highlight } = searchQuery;

    const esQuery: any = {
      index: [this.config.indices.documents, this.config.indices.sections],
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['title^2', 'content'],
                  type: 'best_fields',
                  fuzziness: 'AUTO',
                },
              },
            ],
            filter: [],
          },
        },
        from: ((pagination?.page || 1) - 1) * (pagination?.size || 20),
        size: pagination?.size || 20,
      },
    };

    // Apply filters
    if (filters) {
      if (filters.documentIds) {
        esQuery.body.query.bool.filter.push({
          terms: { _id: filters.documentIds },
        });
      }

      if (filters.authorIds) {
        esQuery.body.query.bool.filter.push({
          terms: { 'createdBy.id': filters.authorIds },
        });
      }

      if (filters.status) {
        esQuery.body.query.bool.filter.push({
          terms: { status: filters.status },
        });
      }

      if (filters.dateRange) {
        const dateFilter: any = { range: { updatedAt: {} } };
        if (filters.dateRange.from) {
          dateFilter.range.updatedAt.gte = filters.dateRange.from;
        }
        if (filters.dateRange.to) {
          dateFilter.range.updatedAt.lte = filters.dateRange.to;
        }
        esQuery.body.query.bool.filter.push(dateFilter);
      }

      if (filters.wordCountRange) {
        const wordCountFilter: any = { range: { wordCount: {} } };
        if (filters.wordCountRange.min) {
          wordCountFilter.range.wordCount.gte = filters.wordCountRange.min;
        }
        if (filters.wordCountRange.max) {
          wordCountFilter.range.wordCount.lte = filters.wordCountRange.max;
        }
        esQuery.body.query.bool.filter.push(wordCountFilter);
      }

      if (filters.tags) {
        esQuery.body.query.bool.filter.push({
          terms: { tags: filters.tags },
        });
      }
    }

    // Apply sorting
    if (sort) {
      esQuery.body.sort = sort.map(s => ({
        [s.field]: { order: s.order },
      }));
    }

    // Apply highlighting
    if (highlight?.enabled) {
      esQuery.body.highlight = {
        fields: {
          title: {},
          content: {
            fragment_size: highlight.fragmentSize || 150,
            number_of_fragments: highlight.numberOfFragments || 3,
          },
        },
      };
    }

    return esQuery;
  }

  private processSearchResponse(response: any): SearchResult {
    const hits: SearchHit[] = response.body.hits.hits.map((hit: any) => ({
      id: hit._id,
      type: hit._index.includes('documents') ? 'document' : 'section',
      score: hit._score,
      source: hit._source,
      highlights: hit.highlight,
    }));

    return {
      total: response.body.hits.total.value,
      hits,
      took: response.body.took,
      aggregations: response.body.aggregations,
    };
  }

  private processSuggestResponse(response: any, type: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    
    if (response.body.suggest) {
      Object.values(response.body.suggest).forEach((suggestionGroup: any) => {
        suggestionGroup.forEach((suggestion: any) => {
          if (suggestion.options) {
            suggestion.options.forEach((option: any) => {
              suggestions.push({
                text: option.text,
                score: option._score || option.score,
                type: type as any,
              });
            });
          }
        });
      });
    }

    return suggestions;
  }

  private async clearIndices(): Promise<void> {
    for (const index of Object.values(this.config.indices)) {
      try {
        await this.client.deleteByQuery({
          index,
          body: { query: { match_all: {} } },
        });
      } catch (error) {
        // Index might not exist, ignore error
      }
    }
  }

  private async checkIndicesExist(): Promise<boolean> {
    try {
      for (const index of Object.values(this.config.indices)) {
        const exists = await this.client.indices.exists({ index });
        if (!exists.body) {
          return false;
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  private extractTags(metadata: any): string[] {
    if (typeof metadata === 'object' && metadata.tags && Array.isArray(metadata.tags)) {
      return metadata.tags;
    }
    return [];
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private recordSearchAnalytics(query: SearchQuery, result: SearchResult, responseTime: number): void {
    const queryString = query.query.toLowerCase().trim();
    const currentCount = this.searchAnalytics.get(queryString) || 0;
    this.searchAnalytics.set(queryString, currentCount + 1);

    // Keep only top 1000 queries to prevent memory issues
    if (this.searchAnalytics.size > 1000) {
      const entries = Array.from(this.searchAnalytics.entries());
      entries.sort((a, b) => b[1] - a[1]);
      this.searchAnalytics.clear();
      entries.slice(0, 500).forEach(([key, value]) => {
        this.searchAnalytics.set(key, value);
      });
    }
  }
}

export default SearchService;