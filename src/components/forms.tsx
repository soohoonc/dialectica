"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownTemplates } from "@/lib/markdown-templates";

export function AuthorForm() {
  const [formData, setFormData] = useState({
    name: '',
    birth: '',
    death: '',
    nationality: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const result = await MarkdownTemplates.createPhilosopherFile({
        name: formData.name,
        birth: formData.birth || undefined,
        death: formData.death || undefined,
        nationality: formData.nationality || undefined,
      });

      setFormData({ name: '', birth: '', death: '', nationality: '' });
      alert(`Philosopher created successfully!\n\nFile: ${result.filename}\nPath: ${result.path}\n\nThe file watcher will automatically sync this to the database.`);
    } catch (error) {
      alert(`Error creating philosopher file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        <p>📝 This will create a markdown file in <code>docs/philosophers/</code></p>
        <p>🔄 The file watcher will automatically sync it to the database</p>
      </div>
      
      <div>
        <Label htmlFor="author-name">Name *</Label>
        <Input
          id="author-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Immanuel Kant"
          required
        />
      </div>
      <div>
        <Label htmlFor="author-birth">Birth Year</Label>
        <Input
          id="author-birth"
          value={formData.birth}
          onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
          placeholder="e.g., 1724 CE or 470 BCE"
        />
      </div>
      <div>
        <Label htmlFor="author-death">Death Year</Label>
        <Input
          id="author-death"
          value={formData.death}
          onChange={(e) => setFormData({ ...formData, death: e.target.value })}
          placeholder="e.g., 1804 CE or leave blank if alive"
        />
      </div>
      <div>
        <Label htmlFor="author-nationality">Nationality</Label>
        <Input
          id="author-nationality"
          value={formData.nationality}
          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
          placeholder="e.g., German, Greek, Chinese"
        />
      </div>
      <Button type="submit" disabled={isCreating}>
        {isCreating ? 'Creating File...' : 'Create Philosopher File'}
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
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const result = await MarkdownTemplates.createPeriodFile({
        name: formData.name,
        description: formData.description || undefined,
        start: formData.start,
        end: formData.end || undefined,
      });

      setFormData({ name: '', description: '', start: '', end: '' });
      alert(`Period created successfully!\n\nFile: ${result.filename}\nPath: ${result.path}\n\nThe file watcher will automatically sync this to the database.`);
    } catch (error) {
      alert(`Error creating period file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        <p>📝 This will create a markdown file in <code>docs/periods/</code></p>
        <p>🔄 The file watcher will automatically sync it to the database</p>
      </div>

      <div>
        <Label htmlFor="period-name">Name *</Label>
        <Input
          id="period-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Ancient Philosophy, Enlightenment"
          required
        />
      </div>
      <div>
        <Label htmlFor="period-description">Description</Label>
        <Input
          id="period-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this historical period"
        />
      </div>
      <div>
        <Label htmlFor="period-start">Start Year *</Label>
        <Input
          id="period-start"
          value={formData.start}
          onChange={(e) => setFormData({ ...formData, start: e.target.value })}
          placeholder="e.g., 600 BCE, 1400 CE"
          required
        />
      </div>
      <div>
        <Label htmlFor="period-end">End Year</Label>
        <Input
          id="period-end"
          value={formData.end}
          onChange={(e) => setFormData({ ...formData, end: e.target.value })}
          placeholder="e.g., 600 CE, or leave blank if ongoing"
        />
      </div>
      <Button type="submit" disabled={isCreating}>
        {isCreating ? 'Creating File...' : 'Create Period File'}
      </Button>
    </form>
  );
}

export function TagForm() {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const result = await MarkdownTemplates.createTagFile(formData.name);

      setFormData({ name: '' });
      alert(`Tag category created successfully!\n\nFile: ${result.filename}\nPath: ${result.path}\n\nYou can now use #${formData.name} in your idea files.`);
    } catch (error) {
      alert(`Error creating tag file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        <p>📝 This will create a tag documentation file in <code>docs/relationships/</code></p>
        <p>🏷️ Use #{formData.name || 'tagname'} in your idea files to reference this tag</p>
      </div>

      <div>
        <Label htmlFor="tag-name">Tag Name *</Label>
        <Input
          id="tag-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Ethics, Metaphysics, Existentialism"
          required
        />
      </div>
      <Button type="submit" disabled={isCreating}>
        {isCreating ? 'Creating File...' : 'Create Tag Documentation'}
      </Button>
    </form>
  );
}

export function IdeaForm() {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    year: '',
    period: '',
    tags: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const result = await MarkdownTemplates.createIdeaFile({
        title: formData.title,
        author: formData.author,
        description: formData.description || undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        period: formData.period || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      setFormData({ title: '', author: '', description: '', year: '', period: '', tags: '' });
      alert(`Idea created successfully!\n\nFile: ${result.filename}\nPath: ${result.path}\n\nThe file watcher will automatically sync this to the database.`);
    } catch (error) {
      alert(`Error creating idea file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        <p>📝 This will create a markdown file in <code>docs/ideas/</code></p>
        <p>🔄 The file watcher will automatically sync it to the database</p>
        <p>🔗 Use exact names for author and period (they must exist first)</p>
      </div>

      <div>
        <Label htmlFor="idea-title">Title *</Label>
        <Input
          id="idea-title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Categorical Imperative, Theory of Forms"
          required
        />
      </div>
      <div>
        <Label htmlFor="idea-author">Author Name *</Label>
        <Input
          id="idea-author"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          placeholder="e.g., Immanuel Kant (must match philosopher file exactly)"
          required
        />
      </div>
      <div>
        <Label htmlFor="idea-description">Description</Label>
        <Input
          id="idea-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this philosophical concept"
        />
      </div>
      <div>
        <Label htmlFor="idea-year">Year</Label>
        <Input
          id="idea-year"
          type="number"
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
          placeholder="e.g., 1785, -380 (negative for BCE)"
        />
      </div>
      <div>
        <Label htmlFor="idea-period">Period Name</Label>
        <Input
          id="idea-period"
          value={formData.period}
          onChange={(e) => setFormData({ ...formData, period: e.target.value })}
          placeholder="e.g., Ancient Philosophy (must match period file exactly)"
        />
      </div>
      <div>
        <Label htmlFor="idea-tags">Tags</Label>
        <Input
          id="idea-tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="e.g., Ethics, Metaphysics, Logic (comma-separated)"
        />
      </div>
      <Button type="submit" disabled={isCreating}>
        {isCreating ? 'Creating File...' : 'Create Idea File'}
      </Button>
    </form>
  );
}

export function RelationshipForm() {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p>📝 <strong>Relationships are now managed in markdown files!</strong></p>
        <p>🔗 Edit idea files directly to add relationships:</p>
        <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono">
          <p>## Influenced By</p>
          <p>- **builds_upon**: [[ideas/theory-of-forms|Theory of Forms]] by [[philosophers/plato|Plato]]</p>
          <p></p>
          <p>## Influences</p>
          <p>- **contradicts**: [[ideas/empiricism|Empiricism]] by [[philosophers/locke|John Locke]]</p>
        </div>
        <p className="mt-2">Available relationship types:</p>
        <ul className="list-disc list-inside text-xs">
          <li><strong>influences</strong> - This idea influences another</li>
          <li><strong>contradicts</strong> - This idea contradicts another</li>
          <li><strong>synthesizes</strong> - This idea synthesizes others</li>
          <li><strong>builds_upon</strong> - This idea builds upon another</li>
          <li><strong>refutes</strong> - This idea refutes another</li>
        </ul>
      </div>
      
      <div className="p-4 border rounded bg-blue-50">
        <h4 className="font-semibold mb-2">How to add relationships:</h4>
        <ol className="list-decimal list-inside text-sm space-y-1">
          <li>Open the idea file you want to edit</li>
          <li>Add relationships in the "Influenced By" or "Influences" sections</li>
          <li>Use the exact format shown above</li>
          <li>Save the file - the watcher will sync automatically</li>
        </ol>
      </div>
    </div>
  );
}