// Ontology type definitions for Dialectica

export type OntologyType = 'figure' | 'time' | 'location' | 'idea' | 'artifact' | 'page';

// Base interface for all nodes
export interface BaseNode {
  id: string;
  type: OntologyType;
  slug: string;
  title: string;
  content: string;        // Raw markdown content (body after front matter)
  tags: string[];
  filePath: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Figure - the who (biographies)
export interface FigureNode extends BaseNode {
  type: 'figure';
  name: string;
  birth?: number;         // Year, negative for BCE
  death?: number;
  nationality?: string;
  portrait?: string;      // Image path
  locations: string[];    // Location IDs
  periods: string[];      // Time IDs
}

// Time - the when (periods)
export interface TimeNode extends BaseNode {
  type: 'time';
  name: string;
  start: number;          // Year
  end?: number;
  parent?: string;        // Parent period ID for hierarchy
  locations: string[];
}

// Location - the where (places)
export interface LocationNode extends BaseNode {
  type: 'location';
  name: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  parent?: string;        // Parent location for hierarchy
}

// Idea - the why (essays, concepts)
export interface IdeaNode extends BaseNode {
  type: 'idea';
  authors: string[];      // Figure IDs
  year?: number;
  periods: string[];      // Time IDs
  influences: string[];   // Ideas this builds upon
  influenced: string[];   // Ideas this influenced (computed from backlinks)
  contradicts: string[];  // Opposing ideas
  synthesizes: string[];  // Ideas combined in this one
}

// Artifact mediums
export type ArtifactMedium =
  | 'book'        // Printed texts
  | 'manuscript'  // Handwritten texts, scrolls
  | 'sculpture'   // 3D works
  | 'painting'    // 2D painted works
  | 'inscription' // Carved/engraved text (steles, tablets)
  | 'mosaic'      // Tile/tessera works
  | 'relief'      // Carved panels
  | 'instrument'  // Scientific/musical instruments
  | 'textile'     // Tapestries, clothing
  | 'ceramic'     // Pottery, vessels
  | 'other';

// Artifact - the what (physical things)
export interface ArtifactNode extends BaseNode {
  type: 'artifact';
  name: string;
  year?: number;
  creator?: string;       // Figure ID
  location?: string;      // Location ID
  image?: string;
  medium?: ArtifactMedium;
  era?: string;           // Time period ID
}

// Page - wiki articles
export interface PageNode extends BaseNode {
  type: 'page';
  authors: string[];
}

// Union type for all nodes
export type GraphNode = FigureNode | TimeNode | LocationNode | IdeaNode | ArtifactNode | PageNode;

// Edge types for relationships
export type EdgeType =
  | 'wiki_link'       // Generic [[link]] reference
  | 'authored'        // Figure -> Idea
  | 'influences'      // Idea -> Idea
  | 'contradicts'     // Idea -> Idea
  | 'synthesizes'     // Idea -> Idea
  | 'located_in'      // Node -> Location
  | 'during_period'   // Node -> Time
  | 'child_of'        // Hierarchical (Location/Time parent)
  | 'created';        // Figure -> Artifact

export interface Edge {
  source: string;
  target: string;
  type: EdgeType;
  context?: string;   // Surrounding text for wiki_link edges
}

// Backlink information
export interface Backlink {
  sourceId: string;
  sourceType: OntologyType;
  sourceTitle: string;
  sourceSlug: string;
  context: string;    // Text surrounding the link
}

// Query options for searching/filtering
export interface QueryOptions {
  type?: OntologyType | OntologyType[];
  tags?: string[];
  period?: { start: number; end: number };
  search?: string;
  author?: string;
  location?: string;
  limit?: number;
  offset?: number;
  sort?: 'title' | 'date' | 'year' | 'name';
  order?: 'asc' | 'desc';
}

export interface QueryResult<T = GraphNode> {
  nodes: T[];
  total: number;
  hasMore: boolean;
}

// Graph data for D3 force visualization
export interface GraphData {
  nodes: Array<{
    id: string;
    title: string;
    type: OntologyType;
    year?: number;
    connectionCount: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: EdgeType;
  }>;
}
