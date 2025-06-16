"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";

export function AuthorEntries() {
  const { data: authors, isLoading, refetch } = trpc.author.list.useQuery();
  
  const deleteAuthor = trpc.author.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error deleting author: ${error.message}`);
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteAuthor.mutate({ id });
    }
  };

  if (isLoading) return <div className="text-center py-4">Loading authors...</div>;

  return (
    <div className="space-y-2">
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
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(author.id, author.name)}
            disabled={deleteAuthor.isPending}
          >
            {deleteAuthor.isPending ? 'Deleting...' : 'Delete'}
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
  const { data: periods, isLoading, refetch } = trpc.period.list.useQuery();
  
  const deletePeriod = trpc.period.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error deleting period: ${error.message}`);
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deletePeriod.mutate({ id });
    }
  };

  if (isLoading) return <div className="text-center py-4">Loading periods...</div>;

  return (
    <div className="space-y-2">
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
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(period.id, period.name)}
            disabled={deletePeriod.isPending}
          >
            {deletePeriod.isPending ? 'Deleting...' : 'Delete'}
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
  const { data: tags, isLoading, refetch } = trpc.tag.list.useQuery();
  
  const deleteTag = trpc.tag.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error deleting tag: ${error.message}`);
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteTag.mutate({ id });
    }
  };

  if (isLoading) return <div className="text-center py-4">Loading tags...</div>;

  return (
    <div className="space-y-2">
      {tags?.map((tag) => (
        <div key={tag.id} className="border rounded p-3 flex justify-between items-center">
          <div className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm">
            {tag.name}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(tag.id, tag.name)}
            disabled={deleteTag.isPending}
          >
            {deleteTag.isPending ? 'Deleting...' : 'Delete'}
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
  const { data: ideas, isLoading, refetch } = trpc.idea.list.useQuery({});
  
  const deleteIdea = trpc.idea.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error deleting idea: ${error.message}`);
    }
  });

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteIdea.mutate({ id });
    }
  };

  if (isLoading) return <div className="text-center py-4">Loading ideas...</div>;

  return (
    <div className="space-y-3">
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
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(idea.id, idea.title)}
            disabled={deleteIdea.isPending}
          >
            {deleteIdea.isPending ? 'Deleting...' : 'Delete'}
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
  const { data: relationships, isLoading, refetch } = trpc.relationship.list.useQuery({});
  
  const deleteRelationship = trpc.relationship.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      alert(`Error deleting relationship: ${error.message}`);
    }
  });

  const handleDelete = (id: string, sourceTitle: string, targetTitle: string) => {
    if (confirm(`Are you sure you want to delete the relationship "${sourceTitle} → ${targetTitle}"? This action cannot be undone.`)) {
      deleteRelationship.mutate({ id });
    }
  };

  if (isLoading) return <div className="text-center py-4">Loading relationships...</div>;

  return (
    <div className="space-y-3">
      {relationships?.map((relationship) => (
        <div key={relationship.id} className="border rounded p-3 flex justify-between items-start">
          <div className="flex-1">
            <div className="font-medium">
              {relationship.sourceIdea.title} → {relationship.targetIdea.title}
            </div>
            <div className="text-sm text-muted-foreground">
              Type: {relationship.type.replace('_', ' ')}
            </div>
            <div className="text-xs text-muted-foreground">
              {relationship.sourceIdea.author.name} → {relationship.targetIdea.author.name}
            </div>
            {relationship.description && (
              <div className="text-sm mt-1">{relationship.description}</div>
            )}
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(relationship.id, relationship.sourceIdea.title, relationship.targetIdea.title)}
            disabled={deleteRelationship.isPending}
          >
            {deleteRelationship.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      ))}
      {!relationships?.length && (
        <div className="text-muted-foreground text-center py-4">No relationships found</div>
      )}
    </div>
  );
}