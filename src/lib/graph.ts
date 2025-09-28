import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';

/**
 * Query the graph to present views
 * 
 * There are four main concepts:
 *  - figures: the who - need to search by name,
 *  - ideas: the what and why - need to search by idea, topic (tags)
 *  - location: the where - need to search by location which is hiearchical
 *  - period: the when - need to search by point in time or intervals.
 */
export interface QueryOptions {

}

const globalForGraph = global as unknown as {
  graph: ReturnType<typeof dialecticaGraph>
}

const dialecticaGraph = (rootDir?: string) => {
  const pwd = path.resolve(rootDir || '')
  const query = async (options: QueryOptions) => {
    const state = await fs.readFile(path.join(pwd, '.dialectica/state.json'), 'utf-8')
      .then(JSON.parse)
    return []
  }

  return {
    query
  }
}

export const graph = globalForGraph.graph || dialecticaGraph()