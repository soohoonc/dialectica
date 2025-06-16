"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthorForm() {
  const [formData, setFormData] = useState({
    name: '',
    birth: '',
    death: '',
    nationality: ''
  });

  const createAuthor = trpc.author.create.useMutation({
    onSuccess: () => {
      setFormData({ name: '', birth: '', death: '', nationality: '' });
      alert('Author created successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAuthor.mutate({
      name: formData.name,
      birth: formData.birth || undefined,
      death: formData.death || undefined,
      nationality: formData.nationality || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="author-name">Name *</Label>
        <Input
          id="author-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="author-birth">Birth Year</Label>
        <Input
          id="author-birth"
          value={formData.birth}
          onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="author-death">Death Year</Label>
        <Input
          id="author-death"
          value={formData.death}
          onChange={(e) => setFormData({ ...formData, death: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="author-nationality">Nationality</Label>
        <Input
          id="author-nationality"
          value={formData.nationality}
          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
        />
      </div>
      <Button type="submit" disabled={createAuthor.isPending}>
        {createAuthor.isPending ? 'Creating...' : 'Create Author'}
      </Button>
    </form>
  );
}

export function PeriodForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start: '',
    end: ''
  });

  const createPeriod = trpc.period.create.useMutation({
    onSuccess: () => {
      setFormData({ name: '', description: '', start: '', end: '' });
      alert('Period created successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPeriod.mutate({
      name: formData.name,
      description: formData.description || undefined,
      start: formData.start,
      end: formData.end || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="period-name">Name *</Label>
        <Input
          id="period-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="period-description">Description</Label>
        <Input
          id="period-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="period-start">Start Year *</Label>
        <Input
          id="period-start"
          value={formData.start}
          onChange={(e) => setFormData({ ...formData, start: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="period-end">End Year</Label>
        <Input
          id="period-end"
          value={formData.end}
          onChange={(e) => setFormData({ ...formData, end: e.target.value })}
        />
      </div>
      <Button type="submit" disabled={createPeriod.isPending}>
        {createPeriod.isPending ? 'Creating...' : 'Create Period'}
      </Button>
    </form>
  );
}

export function TagForm() {
  const [formData, setFormData] = useState({
    name: ''
  });

  const createTag = trpc.tag.create.useMutation({
    onSuccess: () => {
      setFormData({ name: '' });
      alert('Tag created successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTag.mutate({
      name: formData.name,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="tag-name">Name *</Label>
        <Input
          id="tag-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <Button type="submit" disabled={createTag.isPending}>
        {createTag.isPending ? 'Creating...' : 'Create Tag'}
      </Button>
    </form>
  );
}

export function IdeaForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    year: '',
    authorId: '',
    periodId: ''
  });

  const { data: authors } = trpc.author.list.useQuery();
  const { data: periods } = trpc.period.list.useQuery();

  const createIdea = trpc.idea.create.useMutation({
    onSuccess: () => {
      setFormData({ title: '', description: '', year: '', authorId: '', periodId: '' });
      alert('Idea created successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createIdea.mutate({
      title: formData.title,
      description: formData.description || undefined,
      year: formData.year ? parseInt(formData.year) : undefined,
      authorId: formData.authorId,
      periodId: formData.periodId || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="idea-title">Title *</Label>
        <Input
          id="idea-title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="idea-description">Description</Label>
        <Input
          id="idea-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="idea-year">Year</Label>
        <Input
          id="idea-year"
          type="number"
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="idea-author">Author *</Label>
        <select
          id="idea-author"
          value={formData.authorId}
          onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select an author</option>
          {authors?.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="idea-period">Period</Label>
        <select
          id="idea-period"
          value={formData.periodId}
          onChange={(e) => setFormData({ ...formData, periodId: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="">Select a period (optional)</option>
          {periods?.map((period) => (
            <option key={period.id} value={period.id}>
              {period.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={createIdea.isPending}>
        {createIdea.isPending ? 'Creating...' : 'Create Idea'}
      </Button>
    </form>
  );
}

export function RelationshipForm() {
  const [formData, setFormData] = useState({
    sourceIdeaId: '',
    targetIdeaId: '',
    type: '',
    description: ''
  });

  const { data: ideas } = trpc.idea.list.useQuery({});

  const createRelationship = trpc.relationship.create.useMutation({
    onSuccess: () => {
      setFormData({ sourceIdeaId: '', targetIdeaId: '', type: '', description: '' });
      alert('Relationship created successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRelationship.mutate({
      sourceIdeaId: formData.sourceIdeaId,
      targetIdeaId: formData.targetIdeaId,
      type: formData.type as "influences" | "contradicts" | "synthesizes" | "builds_upon" | "refutes",
      description: formData.description || undefined,
    });
  };

  const relationshipTypes = [
    { value: 'influences', label: 'Influences' },
    { value: 'contradicts', label: 'Contradicts' },
    { value: 'synthesizes', label: 'Synthesizes' },
    { value: 'builds_upon', label: 'Builds Upon' },
    { value: 'refutes', label: 'Refutes' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="source-idea">Source Idea *</Label>
        <select
          id="source-idea"
          value={formData.sourceIdeaId}
          onChange={(e) => setFormData({ ...formData, sourceIdeaId: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select source idea</option>
          {ideas?.map((idea) => (
            <option key={idea.id} value={idea.id}>
              {idea.title} ({idea.author.name})
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="target-idea">Target Idea *</Label>
        <select
          id="target-idea"
          value={formData.targetIdeaId}
          onChange={(e) => setFormData({ ...formData, targetIdeaId: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select target idea</option>
          {ideas?.map((idea) => (
            <option key={idea.id} value={idea.id}>
              {idea.title} ({idea.author.name})
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="relationship-type">Relationship Type *</Label>
        <select
          id="relationship-type"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full p-2 border rounded"
          required
        >
          <option value="">Select relationship type</option>
          {relationshipTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="relationship-description">Description</Label>
        <Input
          id="relationship-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <Button type="submit" disabled={createRelationship.isPending}>
        {createRelationship.isPending ? 'Creating...' : 'Create Relationship'}
      </Button>
    </form>
  );
}