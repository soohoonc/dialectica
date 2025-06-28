"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { MarkdownUtils } from "@/lib/markdown";

export function AuthorEntries() {
  const { data: authors, isLoading } = trpc.author.list.useQuery();

  const openMarkdownFile = (name: string) => {
    const slug = MarkdownUtils.slugify(name);
    const filePath = `docs/philosophers/${slug}.md`;
    
    // Show file path and instructions
    alert(`📝 Edit this philosopher's markdown file:\n\n${filePath}\n\nOpen this file in your markdown editor to make changes.\nThe file watcher will automatically sync changes to the database.`);
  };

  if (isLoading) return <div className="text-center py-4">Loading authors...</div>;

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-4">
        <p>📖 These are read-only views from the database</p>
        <p>📝 Click "Edit File" to open the markdown file for editing</p>
      </div>
      
      {authors?.map((author) => (
        <div key={author.id} className="border rounded p-3 flex justify-between items-start">
          <div className="flex-1">
            <div className="font-medium">{author.name}</div>
            <div className="text-sm text-muted-foreground">
              {author.birth && author.death ? `${author.birth} - ${author.death}` : 
               author.birth ? `Born ${author.birth}` : 
               author.death ? `Died ${author.death}` : 'Dates unknown'}
              {author.nationality && ` • ${author.nationality}`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              File: docs/philosophers/{MarkdownUtils.slugify(author.name)}.md
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openMarkdownFile(author.name)}
          >
            Edit File
          </Button>
        </div>
      ))}
      {!authors?.length && (
        <div className="text-muted-foreground text-center py-4">No authors found</div>
      )}
    </div>
  );
}

export function PeriodEntries() {
  const { data: periods, isLoading } = trpc.period.list.useQuery();

  const openMarkdownFile = (name: string) => {
    const slug = MarkdownUtils.slugify(name);
    const filePath = `docs/periods/${slug}.md`;
    
    alert(`📝 Edit this period's markdown file:\n\n${filePath}\n\nOpen this file in your markdown editor to make changes.\nThe file watcher will automatically sync changes to the database.`);
  };

  if (isLoading) return <div className="text-center py-4">Loading periods...</div>;

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-4">
        <p>📖 These are read-only views from the database</p>
        <p>📝 Click "Edit File" to open the markdown file for editing</p>
      </div>

      {periods?.map((period) => (
        <div key={period.id} className="border rounded p-3 flex justify-between items-start">
          <div className="flex-1">
            <div className="font-medium">{period.name}</div>
            <div className="text-sm text-muted-foreground">
              {period.start}{period.end ? ` - ${period.end}` : ' - Present'}
            </div>
            {period.description && (
              <div className="text-sm mt-1">{period.description}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              File: docs/periods/{MarkdownUtils.slugify(period.name)}.md
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openMarkdownFile(period.name)}
          >
            Edit File
          </Button>
        </div>
      ))}
      {!periods?.length && (
        <div className="text-muted-foreground text-center py-4">No periods found</div>
      )}
    </div>
  );
}

export function TagEntries() {
  const { data: tags, isLoading } = trpc.tag.list.useQuery();

  const openMarkdownFile = (name: string) => {
    const slug = MarkdownUtils.slugify(name);
    const filePath = `docs/relationships/${slug}.md`;
    
    alert(`📝 View this tag's documentation file:\n\n${filePath}\n\nThis file may not exist yet. Tags are primarily used in idea files with #${name} syntax.`);
  };

  if (isLoading) return <div className="text-center py-4">Loading tags...</div>;

  return (
    <div className="space-y-2">
      <div className="text-sm text-muted-foreground mb-4">
        <p>📖 These tags are extracted from markdown files</p>
        <p>🏷️ Use #{tags?.[0]?.name || 'tagname'} syntax in idea files</p>
      </div>

      {tags?.map((tag) => (
        <div key={tag.id} className="border rounded p-3 flex justify-between items-center">
          <div className="flex-1">
            <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm inline-block">
              #{tag.name}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Reference: docs/relationships/{MarkdownUtils.slugify(tag.name)}.md
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openMarkdownFile(tag.name)}
          >
            View Docs
          </Button>
        </div>
      ))}
      {!tags?.length && (
        <div className="text-muted-foreground text-center py-4">No tags found</div>
      )}
    </div>
  );
}

export function IdeaEntries() {
  const { data: ideas, isLoading } = trpc.idea.list.useQuery({});

  const openMarkdownFile = (title: string) => {
    const slug = MarkdownUtils.slugify(title);
    const filePath = `docs/ideas/${slug}.md`;
    
    alert(`📝 Edit this idea's markdown file:\n\n${filePath}\n\nOpen this file in your markdown editor to make changes.\nYou can add relationships, tags, and detailed descriptions.\nThe file watcher will automatically sync changes to the database.`);
  };

  if (isLoading) return <div className="text-center py-4">Loading ideas...</div>;

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-4">
        <p>📖 These are read-only views from the database</p>
        <p>📝 Click "Edit File" to open the markdown file for editing</p>
        <p>🔗 Add relationships and tags directly in the markdown files</p>
      </div>

      {ideas?.map((idea) => (
        <div key={idea.id} className="border rounded p-3 flex justify-between items-start">
          <div className="flex-1">
            <div className="font-medium">{idea.title}</div>
            <div className="text-sm text-muted-foreground">
              by {idea.author.name}
              {idea.year && ` • ${idea.year}`}
              {idea.period && ` • ${idea.period.name}`}
            </div>
            {idea.description && (
              <div className="text-sm mt-1">{idea.description}</div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              File: docs/ideas/{MarkdownUtils.slugify(idea.title)}.md
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openMarkdownFile(idea.title)}
          >
            Edit File
          </Button>
        </div>
      ))}
      {!ideas?.length && (
        <div className="text-muted-foreground text-center py-4">No ideas found</div>
      )}
    </div>
  );
}

export function RelationshipEntries() {
  const { data: relationships, isLoading } = trpc.relationship.list.useQuery({});

  if (isLoading) return <div className="text-center py-4">Loading relationships...</div>;

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground mb-4">
        <p>📖 These relationships are extracted from markdown files</p>
        <p>📝 Edit idea files directly to modify relationships</p>
        <p>🔗 Use the format: <code>- **type**: [[ideas/target|Title]] by [[philosophers/author|Name]]</code></p>
      </div>

      {relationships?.map((relationship) => (
        <div key={relationship.id} className="border rounded p-3">
          <div className="font-medium">
            {relationship.sourceIdea.title} → {relationship.targetIdea.title}
          </div>
          <div className="text-sm text-muted-foreground">
            Type: <span className="bg-secondary px-2 py-1 rounded text-xs">{relationship.type.replace('_', ' ')}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {relationship.sourceIdea.author.name} → {relationship.targetIdea.author.name}
          </div>
          {relationship.description && (
            <div className="text-sm mt-1">{relationship.description}</div>
          )}
          <div className="text-xs text-muted-foreground mt-2 p-2 bg-gray-50 rounded">
            📝 Edit in: docs/ideas/{MarkdownUtils.slugify(relationship.sourceIdea.title)}.md
          </div>
        </div>
      ))}
      {!relationships?.length && (
        <div className="text-muted-foreground text-center py-4">
          <p>No relationships found</p>
          <p className="text-xs mt-1">Add relationships by editing idea markdown files</p>
        </div>
      )}
    </div>
  );
}