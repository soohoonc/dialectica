// Main Graph class for Dialectica

import fs from 'fs/promises';
import path from 'path';
import chokidar from 'chokidar';
import type {
  OntologyType,
  GraphNode,
  FigureNode,
  TimeNode,
  IdeaNode,
  Edge,
  EdgeType,
  Backlink,
  QueryOptions,
  QueryResult,
  GraphData,
} from './types';
import { parseMarkdownFile } from './parser';
import { parseWikiLinks, extractLinkContext, normalizeTarget } from './wikilinks';

export class Graph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Edge[] = [];
  private backlinks: Map<string, Backlink[]> = new Map();
  private watcher?: ReturnType<typeof chokidar.watch>;
  private docsPath: string;
  private initialized: boolean = false;
  private initializing: Promise<void> | null = null;

  constructor(docsPath: string = './docs') {
    this.docsPath = path.resolve(docsPath);
  }

  /**
   * Initialize the graph by loading all markdown files
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = this._doInitialize();
    await this.initializing;
  }

  private async _doInitialize(): Promise<void> {
    try {
      await this.loadAllFiles();
      this.buildEdges();
      this.buildBacklinks();
      this.initialized = true;
      console.log(`[Graph] Initialized with ${this.nodes.size} nodes and ${this.edges.length} edges`);
    } catch (error) {
      console.error('[Graph] Initialization error:', error);
      // Still mark as initialized to prevent infinite retries
      this.initialized = true;
    }
  }

  /**
   * Load all markdown files from the docs directory
   */
  private async loadAllFiles(): Promise<void> {
    try {
      await fs.access(this.docsPath);
    } catch {
      console.warn(`[Graph] Docs directory not found: ${this.docsPath}`);
      return;
    }

    const files = await this.findMarkdownFiles(this.docsPath);

    for (const filePath of files) {
      await this.loadFile(filePath);
    }
  }

  /**
   * Recursively find all markdown files
   */
  private async findMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          const subFiles = await this.findMarkdownFiles(fullPath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`[Graph] Error reading directory ${dir}:`, error);
    }

    return files;
  }

  /**
   * Load a single markdown file
   */
  private async loadFile(filePath: string): Promise<GraphNode | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const node = parseMarkdownFile(content, filePath);

      if (node) {
        this.nodes.set(node.id, node);
        return node;
      }
    } catch (error) {
      console.error(`[Graph] Error loading file ${filePath}:`, error);
    }

    return null;
  }

  /**
   * Build edges from node relationships and wiki-links
   */
  private buildEdges(): void {
    this.edges = [];

    for (const node of this.nodes.values()) {
      // Build edges from explicit relationships in front matter
      this.buildRelationshipEdges(node);

      // Build edges from wiki-links in content
      this.buildWikiLinkEdges(node);
    }

    // Compute reverse relationships for ideas (influenced)
    this.computeInfluencedRelationships();
  }

  private buildRelationshipEdges(node: GraphNode): void {
    switch (node.type) {
      case 'figure': {
        const figure = node as FigureNode;
        // Figure -> Location
        for (const locId of figure.locations) {
          this.edges.push({ source: figure.id, target: locId, type: 'located_in' });
        }
        // Figure -> Time (period)
        for (const periodId of figure.periods) {
          this.edges.push({ source: figure.id, target: periodId, type: 'during_period' });
        }
        break;
      }

      case 'idea': {
        const idea = node as IdeaNode;
        // Idea -> Figure (author)
        for (const authorId of idea.authors) {
          this.edges.push({ source: authorId, target: idea.id, type: 'authored' });
        }
        // Idea -> Idea relationships
        for (const influenceId of idea.influences) {
          this.edges.push({ source: influenceId, target: idea.id, type: 'influences' });
        }
        for (const contradictId of idea.contradicts) {
          this.edges.push({ source: idea.id, target: contradictId, type: 'contradicts' });
        }
        for (const synthesizeId of idea.synthesizes) {
          this.edges.push({ source: idea.id, target: synthesizeId, type: 'synthesizes' });
        }
        // Idea -> Time
        for (const periodId of idea.periods) {
          this.edges.push({ source: idea.id, target: periodId, type: 'during_period' });
        }
        break;
      }

      case 'time': {
        const time = node as TimeNode;
        if (time.parent) {
          this.edges.push({ source: time.id, target: time.parent, type: 'child_of' });
        }
        break;
      }

      case 'location': {
        const location = node;
        if ('parent' in location && location.parent) {
          this.edges.push({ source: location.id, target: location.parent as string, type: 'child_of' });
        }
        break;
      }

      case 'artifact': {
        const obj = node;
        if ('creator' in obj && obj.creator) {
          this.edges.push({ source: obj.creator as string, target: obj.id, type: 'created' });
        }
        if ('location' in obj && obj.location) {
          this.edges.push({ source: obj.id, target: obj.location as string, type: 'located_in' });
        }
        break;
      }
    }
  }

  private buildWikiLinkEdges(node: GraphNode): void {
    const links = parseWikiLinks(node.content);

    for (const link of links) {
      const targetNode = this.resolveTarget(link.target);

      if (targetNode) {
        const context = extractLinkContext(node.content, link);
        this.edges.push({
          source: node.id,
          target: targetNode.id,
          type: 'wiki_link',
          context,
        });
      }
    }
  }

  /**
   * Resolve a wiki-link target to a node
   */
  private resolveTarget(target: string): GraphNode | null {
    // Direct ID match
    if (this.nodes.has(target)) {
      return this.nodes.get(target)!;
    }

    // Try with type prefix stripped (e.g., "f/aristotle" -> "aristotle")
    const withoutPrefix = target.includes('/') ? target.split('/').pop()! : target;
    if (this.nodes.has(withoutPrefix)) {
      return this.nodes.get(withoutPrefix)!;
    }

    // Search by slug
    for (const node of this.nodes.values()) {
      if (node.slug === target || node.slug === withoutPrefix) {
        return node;
      }
    }

    return null;
  }

  /**
   * Compute reverse "influenced" relationships for ideas
   */
  private computeInfluencedRelationships(): void {
    for (const node of this.nodes.values()) {
      if (node.type === 'idea') {
        const idea = node as IdeaNode;
        idea.influenced = [];

        // Find all ideas that list this idea in their "influences"
        for (const otherNode of this.nodes.values()) {
          if (otherNode.type === 'idea' && otherNode.id !== idea.id) {
            const otherIdea = otherNode as IdeaNode;
            if (otherIdea.influences.includes(idea.id)) {
              idea.influenced.push(otherIdea.id);
            }
          }
        }
      }
    }
  }

  /**
   * Build backlinks map for all nodes
   */
  private buildBacklinks(): void {
    this.backlinks = new Map();

    for (const edge of this.edges) {
      if (edge.type === 'wiki_link') {
        const sourceNode = this.nodes.get(edge.source);
        if (!sourceNode) continue;

        const existing = this.backlinks.get(edge.target) || [];
        existing.push({
          sourceId: sourceNode.id,
          sourceType: sourceNode.type,
          sourceTitle: sourceNode.title,
          sourceSlug: sourceNode.slug,
          context: edge.context || '',
        });
        this.backlinks.set(edge.target, existing);
      }
    }
  }

  /**
   * Start file watcher for hot-reload
   */
  watch(): void {
    if (this.watcher) return;

    this.watcher = chokidar.watch(this.docsPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
    });

    this.watcher
      .on('add', (filePath: string) => this.handleFileChange(filePath, 'add'))
      .on('change', (filePath: string) => this.handleFileChange(filePath, 'change'))
      .on('unlink', (filePath: string) => this.handleFileChange(filePath, 'unlink'));

    console.log(`[Graph] Watching ${this.docsPath} for changes`);
  }

  private async handleFileChange(filePath: string, event: 'add' | 'change' | 'unlink'): Promise<void> {
    if (!filePath.endsWith('.md')) return;

    console.log(`[Graph] File ${event}: ${filePath}`);

    if (event === 'unlink') {
      // Find and remove node by file path
      for (const [id, node] of this.nodes) {
        if (node.filePath === filePath) {
          this.nodes.delete(id);
          break;
        }
      }
    } else {
      await this.loadFile(filePath);
    }

    // Rebuild edges and backlinks
    this.buildEdges();
    this.buildBacklinks();
  }

  /**
   * Stop file watcher
   */
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
  }

  // === Query Methods ===

  /**
   * Get a single node by ID
   */
  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes of a specific type
   */
  getNodesByType<T extends GraphNode = GraphNode>(type: OntologyType): T[] {
    const result: T[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === type) {
        result.push(node as T);
      }
    }
    return result;
  }

  /**
   * Get backlinks for a node
   */
  getBacklinks(id: string): Backlink[] {
    return this.backlinks.get(id) || [];
  }

  /**
   * Get related nodes by edge type
   */
  getRelated(id: string, edgeType?: EdgeType): GraphNode[] {
    const related: GraphNode[] = [];
    const seenIds = new Set<string>();

    for (const edge of this.edges) {
      if (edgeType && edge.type !== edgeType) continue;

      let targetId: string | null = null;

      if (edge.source === id) {
        targetId = edge.target;
      } else if (edge.target === id) {
        targetId = edge.source;
      }

      if (targetId && !seenIds.has(targetId)) {
        const node = this.nodes.get(targetId);
        if (node) {
          related.push(node);
          seenIds.add(targetId);
        }
      }
    }

    return related;
  }

  /**
   * Get ideas by author
   */
  getIdeasByAuthor(authorId: string): IdeaNode[] {
    const ideas: IdeaNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === 'idea') {
        const idea = node as IdeaNode;
        if (idea.authors.includes(authorId)) {
          ideas.push(idea);
        }
      }
    }
    return ideas;
  }

  /**
   * Search nodes by text
   */
  search(query: string, options?: { types?: OntologyType[] }): GraphNode[] {
    const normalizedQuery = query.toLowerCase();
    const results: GraphNode[] = [];

    for (const node of this.nodes.values()) {
      if (options?.types && !options.types.includes(node.type)) {
        continue;
      }

      const searchText = `${node.title} ${node.content} ${node.tags.join(' ')}`.toLowerCase();

      if (searchText.includes(normalizedQuery)) {
        results.push(node);
      }
    }

    return results;
  }

  /**
   * Query nodes with filtering, sorting, and pagination
   */
  query(options: QueryOptions = {}): QueryResult {
    let results = Array.from(this.nodes.values());

    // Filter by type
    if (options.type) {
      const types = Array.isArray(options.type) ? options.type : [options.type];
      results = results.filter(n => types.includes(n.type));
    }

    // Filter by tags
    if (options.tags?.length) {
      results = results.filter(n =>
        options.tags!.some(tag => n.tags.includes(tag))
      );
    }

    // Filter by search text
    if (options.search) {
      const q = options.search.toLowerCase();
      results = results.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
      );
    }

    // Filter by period (for nodes with year)
    if (options.period) {
      results = results.filter(n => {
        if ('year' in n && typeof n.year === 'number') {
          return n.year >= options.period!.start && n.year <= options.period!.end;
        }
        if ('start' in n && typeof n.start === 'number') {
          return n.start >= options.period!.start;
        }
        return true;
      });
    }

    // Sort
    const sortKey = options.sort || 'title';
    const sortOrder = options.order === 'desc' ? -1 : 1;

    results.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortKey) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'name':
          aVal = ('name' in a ? String(a.name) : a.title).toLowerCase();
          bVal = ('name' in b ? String(b.name) : b.title).toLowerCase();
          break;
        case 'year':
        case 'date':
          aVal = ('year' in a ? Number(a.year) : 0) || 0;
          bVal = ('year' in b ? Number(b.year) : 0) || 0;
          break;
      }

      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });

    const total = results.length;

    // Pagination
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    results = results.slice(offset, offset + limit);

    return {
      nodes: results,
      total,
      hasMore: offset + results.length < total,
    };
  }

  /**
   * Get graph data for D3 force-directed visualization
   */
  getGraphData(options?: { type?: OntologyType; depth?: number; centerId?: string }): GraphData {
    let nodeIds: Set<string>;

    if (options?.centerId && options?.depth) {
      // Get subgraph around a center node
      nodeIds = this.getSubgraphNodeIds(options.centerId, options.depth);
    } else {
      // Get all nodes of type, or all ideas by default
      const type = options?.type || 'idea';
      nodeIds = new Set(
        Array.from(this.nodes.values())
          .filter(n => n.type === type)
          .map(n => n.id)
      );
    }

    // Build nodes array
    const graphNodes = Array.from(nodeIds).map(id => {
      const node = this.nodes.get(id)!;
      const connectionCount = this.edges.filter(
        e => e.source === id || e.target === id
      ).length;

      return {
        id: node.id,
        title: node.title,
        type: node.type,
        year: 'year' in node ? (node.year as number) : undefined,
        connectionCount,
      };
    });

    // Build edges array (only between included nodes)
    const graphEdges = this.edges
      .filter(e =>
        nodeIds.has(e.source) &&
        nodeIds.has(e.target) &&
        e.type !== 'wiki_link' // Exclude generic wiki links for cleaner graph
      )
      .map(e => ({
        source: e.source,
        target: e.target,
        type: e.type,
      }));

    return { nodes: graphNodes, edges: graphEdges };
  }

  /**
   * Get all node IDs within N hops of a center node
   */
  private getSubgraphNodeIds(centerId: string, depth: number): Set<string> {
    const nodeIds = new Set<string>([centerId]);
    let frontier = new Set<string>([centerId]);

    for (let i = 0; i < depth; i++) {
      const newFrontier = new Set<string>();

      for (const id of frontier) {
        for (const edge of this.edges) {
          if (edge.source === id && !nodeIds.has(edge.target)) {
            nodeIds.add(edge.target);
            newFrontier.add(edge.target);
          }
          if (edge.target === id && !nodeIds.has(edge.source)) {
            nodeIds.add(edge.source);
            newFrontier.add(edge.source);
          }
        }
      }

      frontier = newFrontier;
    }

    return nodeIds;
  }

  /**
   * Resolve a wiki-link target to URL info
   */
  resolveLink(target: string): { href: string; exists: boolean } | null {
    const normalized = normalizeTarget(target);
    const node = this.resolveTarget(normalized);

    if (!node) {
      return { href: `/${normalized}`, exists: false };
    }

    const typePrefix = node.type === 'page' ? 'p' : node.type.charAt(0);
    return {
      href: `/${typePrefix}/${node.slug}`,
      exists: true,
    };
  }

  /**
   * Get all nodes (for debugging/stats)
   */
  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges (for debugging/stats)
   */
  getAllEdges(): Edge[] {
    return [...this.edges];
  }
}

// Re-export types
export * from './types';
export * from './wikilinks';
export * from './parser';

// === Singleton ===

// Get docs path from environment or use default
const docsPath = process.env.DOCS_PATH || './docs';

// Singleton instance
let graphInstance: Graph | null = null;

/**
 * Get the graph singleton instance
 */
export function getGraph(): Graph {
  if (!graphInstance) {
    graphInstance = new Graph(docsPath);
  }
  return graphInstance;
}

// Export singleton instance
export const graph = getGraph();
