import {
  createTRPCRouter,
  publicProcedure
} from "@/trpc";
import { MarkdownUtils } from "@/lib/markdown";

export const exportRouter = createTRPCRouter({
  exportAll: publicProcedure
    .mutation(async ({ ctx }) => {
      const results = {
        philosophers: [],
        ideas: [],
        periods: [],
        overview: null
      } as {
        philosophers: Array<{ filename: string; path: string }>;
        ideas: Array<{ filename: string; path: string }>;
        periods: Array<{ filename: string; path: string }>;
        overview: { filename: string; path: string } | null;
      };

      // Export all philosophers
      const authors = await ctx.db.author.findMany({
        include: {
          ideas: {
            include: {
              period: true,
              tags: { include: { tag: true } },
              outgoingRelations: {
                include: {
                  targetIdea: { include: { author: true } }
                }
              },
              incomingRelations: {
                include: {
                  sourceIdea: { include: { author: true } }
                }
              }
            },
            orderBy: { year: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      });

      for (const author of authors) {
        const frontmatter = {
          id: author.id,
          name: author.name,
          birth: author.birth,
          death: author.death,
          nationality: author.nationality,
          createdAt: author.createdAt.toISOString(),
          updatedAt: author.updatedAt.toISOString(),
          ideaCount: author.ideas.length
        };

        let content = `# ${author.name}\n\n`;
        
        if (author.birth || author.death) {
          content += `**Lifespan**: ${author.birth || '?'} - ${author.death || 'present'}\n\n`;
        }
        
        if (author.nationality) {
          content += `**Nationality**: ${author.nationality}\n\n`;
        }

        if (author.ideas.length > 0) {
          content += `## Ideas (${author.ideas.length})\n\n`;
          
          for (const idea of author.ideas) {
            content += `### ${MarkdownUtils.createWikilink(idea.title, 'ideas')}\n\n`;
            
            if (idea.year) {
              content += `**Year**: ${idea.year}\n\n`;
            }
            
            if (idea.period) {
              content += `**Period**: ${MarkdownUtils.createWikilink(idea.period.name, 'periods')}\n\n`;
            }
            
            if (idea.description) {
              content += `${idea.description}\n\n`;
            }
            
            if (idea.tags.length > 0) {
              content += `**Tags**: ${idea.tags.map(t => `#${t.tag.name}`).join(', ')}\n\n`;
            }
            
            if (idea.outgoingRelations.length > 0) {
              content += `**Influences**:\n`;
              for (const rel of idea.outgoingRelations) {
                content += `- ${rel.type}: ${MarkdownUtils.createWikilink(rel.targetIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.targetIdea.author.name, 'philosophers')}\n`;
              }
              content += '\n';
            }
            
            if (idea.incomingRelations.length > 0) {
              content += `**Influenced by**:\n`;
              for (const rel of idea.incomingRelations) {
                content += `- ${rel.type}: ${MarkdownUtils.createWikilink(rel.sourceIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.sourceIdea.author.name, 'philosophers')}\n`;
              }
              content += '\n';
            }
            
            content += '---\n\n';
          }
        }

        const filename = MarkdownUtils.slugify(author.name);
        await MarkdownUtils.writeMarkdown('philosophers', filename, frontmatter, content);
        
        results.philosophers.push({
          filename: `${filename}.md`,
          path: `docs/philosophers/${filename}.md`
        });
      }

      // Export all ideas
      const ideas = await ctx.db.idea.findMany({
        include: {
          author: true,
          period: true,
          tags: {
            include: {
              tag: true
            }
          },
          outgoingRelations: {
            include: {
              targetIdea: {
                include: {
                  author: true
                }
              }
            }
          },
          incomingRelations: {
            include: {
              sourceIdea: {
                include: {
                  author: true
                }
              }
            }
          }
        },
        orderBy: {
          year: 'asc'
        }
      });

      for (const idea of ideas) {
        const frontmatter = {
          id: idea.id,
          title: idea.title,
          author: idea.author.name,
          authorId: idea.authorId,
          year: idea.year,
          period: idea.period?.name,
          periodId: idea.periodId,
          tags: idea.tags.map(t => t.tag.name),
          createdAt: idea.createdAt.toISOString(),
          updatedAt: idea.updatedAt.toISOString(),
          relationshipCount: {
            incoming: idea.incomingRelations.length,
            outgoing: idea.outgoingRelations.length
          }
        };

        let content = `# ${idea.title}\n\n`;
        
        content += `**Author**: ${MarkdownUtils.createWikilink(idea.author.name, 'philosophers')}\n\n`;
        
        if (idea.year) {
          content += `**Year**: ${idea.year}\n\n`;
        }
        
        if (idea.period) {
          content += `**Historical Period**: ${MarkdownUtils.createWikilink(idea.period.name, 'periods')}\n\n`;
        }
        
        if (idea.tags.length > 0) {
          content += `**Tags**: ${idea.tags.map(t => `#${t.tag.name}`).join(', ')}\n\n`;
        }

        if (idea.description) {
          content += `## Description\n\n${idea.description}\n\n`;
        }

        if (idea.incomingRelations.length > 0) {
          content += `## Influenced By\n\n`;
          for (const rel of idea.incomingRelations) {
            content += `- **${rel.type}**: ${MarkdownUtils.createWikilink(rel.sourceIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.sourceIdea.author.name, 'philosophers')}`;
            if (rel.description) {
              content += ` - ${rel.description}`;
            }
            content += '\n';
          }
          content += '\n';
        }
        
        if (idea.outgoingRelations.length > 0) {
          content += `## Influences\n\n`;
          for (const rel of idea.outgoingRelations) {
            content += `- **${rel.type}**: ${MarkdownUtils.createWikilink(rel.targetIdea.title, 'ideas')} by ${MarkdownUtils.createWikilink(rel.targetIdea.author.name, 'philosophers')}`;
            if (rel.description) {
              content += ` - ${rel.description}`;
            }
            content += '\n';
          }
          content += '\n';
        }

        content += `## Notes\n\n<!-- Add your research notes, quotes, and analysis here -->\n\n`;
        content += `## Related Concepts\n\n<!-- Link to related philosophical concepts -->\n\n`;

        const filename = MarkdownUtils.slugify(idea.title);
        await MarkdownUtils.writeMarkdown('ideas', filename, frontmatter, content);

        results.ideas.push({
          filename: `${filename}.md`,
          path: `docs/ideas/${filename}.md`
        });
      }

      // Export all periods
      const periods = await ctx.db.period.findMany({
        include: {
          ideas: {
            include: {
              author: true,
              tags: {
                include: {
                  tag: true
                }
              },
              outgoingRelations: {
                include: {
                  targetIdea: {
                    include: {
                      author: true
                    }
                  }
                }
              },
              incomingRelations: {
                include: {
                  sourceIdea: {
                    include: {
                      author: true
                    }
                  }
                }
              }
            },
            orderBy: {
              year: 'asc'
            }
          }
        },
        orderBy: {
          start: 'asc'
        }
      });

      for (const period of periods) {
        const frontmatter = {
          id: period.id,
          name: period.name,
          start: period.start,
          end: period.end,
          description: period.description,
          createdAt: period.createdAt.toISOString(),
          updatedAt: period.updatedAt.toISOString(),
          ideaCount: period.ideas.length,
          authors: [...new Set(period.ideas.map(i => i.author.name))].sort()
        };

        let content = `# ${period.name}\n\n`;
        
        content += `**Time Period**: ${period.start}${period.end ? ` - ${period.end}` : ' - present'}\n\n`;
        
        if (period.description) {
          content += `## Overview\n\n${period.description}\n\n`;
        }

        if (period.ideas.length > 0) {
          content += `## Key Ideas (${period.ideas.length})\n\n`;
          
          const ideasByAuthor = period.ideas.reduce((acc, idea) => {
            const authorName = idea.author.name;
            if (!acc[authorName]) {
              acc[authorName] = [];
            }
            acc[authorName].push(idea);
            return acc;
          }, {} as Record<string, typeof period.ideas>);

          for (const [authorName, ideas] of Object.entries(ideasByAuthor)) {
            content += `### ${MarkdownUtils.createWikilink(authorName, 'philosophers')}\n\n`;
            
            for (const idea of ideas) {
              content += `- **${MarkdownUtils.createWikilink(idea.title, 'ideas')}**`;
              if (idea.year) {
                content += ` (${idea.year})`;
              }
              if (idea.description) {
                content += `: ${idea.description.substring(0, 150)}${idea.description.length > 150 ? '...' : ''}`;
              }
              content += '\n';
              
              if (idea.tags.length > 0) {
                content += `  - Tags: ${idea.tags.map(t => `#${t.tag.name}`).join(', ')}\n`;
              }
            }
            content += '\n';
          }

          const totalInfluences = period.ideas.reduce((acc, idea) => 
            acc + idea.outgoingRelations.length + idea.incomingRelations.length, 0
          );

          if (totalInfluences > 0) {
            content += `## Intellectual Networks\n\n`;
            content += `This period contains ${totalInfluences} documented relationships between ideas, showing the rich intellectual discourse of the time.\n\n`;

            const majorInfluences = period.ideas
              .filter(idea => idea.outgoingRelations.length > 0)
              .sort((a, b) => b.outgoingRelations.length - a.outgoingRelations.length)
              .slice(0, 5);

            if (majorInfluences.length > 0) {
              content += `### Most Influential Ideas\n\n`;
              for (const idea of majorInfluences) {
                content += `- ${MarkdownUtils.createWikilink(idea.title, 'ideas')} by ${MarkdownUtils.createWikilink(idea.author.name, 'philosophers')} (${idea.outgoingRelations.length} influences)\n`;
              }
              content += '\n';
            }
          }
        }

        content += `## Timeline\n\n`;
        content += `<!-- Add a chronological timeline of major events and ideas from this period -->\n\n`;
        
        content += `## Context\n\n`;
        content += `<!-- Add historical, cultural, and political context for this period -->\n\n`;

        content += `## Legacy\n\n`;
        content += `<!-- Discuss how this period influenced later philosophical thought -->\n\n`;

        const filename = MarkdownUtils.slugify(period.name);
        await MarkdownUtils.writeMarkdown('periods', filename, frontmatter, content);

        results.periods.push({
          filename: `${filename}.md`,
          path: `docs/periods/${filename}.md`
        });
      }

      // Create overview/index file
      const overviewFrontmatter = {
        title: "Philosophical Timeline Documentation",
        generated: new Date().toISOString(),
        totalPhilosophers: results.philosophers.length,
        totalIdeas: results.ideas.length,
        totalPeriods: results.periods.length
      };

      let overviewContent = `# Philosophical Timeline Documentation\n\n`;
      overviewContent += `Generated: ${new Date().toLocaleString()}\n\n`;
      
      overviewContent += `## Overview\n\n`;
      overviewContent += `This documentation contains ${results.philosophers.length} philosophers, ${results.ideas.length} ideas, and ${results.periods.length} historical periods, all interconnected through a rich web of intellectual relationships.\n\n`;

      if (results.periods.length > 0) {
        overviewContent += `## Historical Periods\n\n`;
        for (const period of results.periods) {
          overviewContent += `- ${MarkdownUtils.createWikilink(period.filename.replace('.md', ''), 'periods')}\n`;
        }
        overviewContent += '\n';
      }

      if (results.philosophers.length > 0) {
        overviewContent += `## Philosophers\n\n`;
        for (const philosopher of results.philosophers) {
          overviewContent += `- ${MarkdownUtils.createWikilink(philosopher.filename.replace('.md', ''), 'philosophers')}\n`;
        }
        overviewContent += '\n';
      }

      overviewContent += `## How to Use This Documentation\n\n`;
      overviewContent += `1. **Browse by Period**: Start with historical periods to understand the chronological development of ideas\n`;
      overviewContent += `2. **Explore Philosophers**: Read about individual thinkers and their contributions\n`;
      overviewContent += `3. **Follow Ideas**: Trace the evolution and influence of specific philosophical concepts\n`;
      overviewContent += `4. **Use Cross-References**: Click on wikilinks to navigate between related concepts\n\n`;

      overviewContent += `## Tags and Categories\n\n`;
      overviewContent += `<!-- Add information about the tagging system and major philosophical categories -->\n\n`;

      overviewContent += `## Timeline Navigation\n\n`;
      overviewContent += `<!-- Add guidance for navigating the chronological aspects -->\n\n`;

      await MarkdownUtils.writeMarkdown('.', 'index', overviewFrontmatter, overviewContent);
      
      results.overview = {
        filename: 'index.md',
        path: 'docs/index.md'
      };

      return results;
    }),

});