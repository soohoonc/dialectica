"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthorForm, PeriodForm, TagForm, IdeaForm, RelationshipForm } from "@/components/forms";
import { AuthorEntries, PeriodEntries, TagEntries, IdeaEntries, RelationshipEntries } from "@/components/entries";
import { trpc } from "@/trpc/client";

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Query watcher status
  const { data: watcherStatus, refetch: refetchWatcherStatus } = trpc.import.watcherStatus.useQuery();

  const exportAllMutation = trpc.export.exportAll.useMutation({
    onSuccess: (data: any) => {
      console.log('Export completed:', data);
      alert(`Export completed! Generated ${data.philosophers.length} philosopher files, ${data.ideas.length} idea files, and ${data.periods.length} period files.`);
    },
    onError: (error: any) => {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    },
    onSettled: () => {
      setIsExporting(false);
    }
  });

  const importAllMutation = trpc.import.syncFromMarkdown.useMutation({
    onSuccess: (data: any) => {
      console.log('Import completed:', data);
      const summary = `Import completed!
      
Created:
- ${data.created.philosophers} philosophers
- ${data.created.ideas} ideas  
- ${data.created.periods} periods
- ${data.created.tags} tags
- ${data.created.relationships} relationships

Updated:
- ${data.updated.philosophers} philosophers
- ${data.updated.ideas} ideas
- ${data.updated.periods} periods
- ${data.updated.tags} tags
- ${data.updated.relationships} relationships

${data.errors.length > 0 ? `\nErrors (${data.errors.length}):\n${data.errors.slice(0, 5).join('\n')}${data.errors.length > 5 ? '\n...' : ''}` : ''}`;
      
      alert(summary);
    },
    onError: (error: any) => {
      console.error('Import failed:', error);
      alert('Import failed: ' + error.message);
    },
    onSettled: () => {
      setIsImporting(false);
    }
  });

  const handleExportAll = async () => {
    setIsExporting(true);
    exportAllMutation.mutate();
  };

  const handleImportAll = async () => {
    setIsImporting(true);
    importAllMutation.mutate();
  };

  const startWatcherMutation = trpc.import.startWatcher.useMutation({
    onSuccess: () => {
      refetchWatcherStatus();
    }
  });

  const stopWatcherMutation = trpc.import.stopWatcher.useMutation({
    onSuccess: () => {
      refetchWatcherStatus();
    }
  });

  const handleToggleWatcher = () => {
    if (watcherStatus?.isRunning) {
      stopWatcherMutation.mutate();
    } else {
      startWatcherMutation.mutate();
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="flex gap-3">
          <Button 
            onClick={handleImportAll} 
            disabled={isImporting}
            variant="default"
          >
            {isImporting ? 'Importing...' : 'Import from Markdown'}
          </Button>
          <Button 
            onClick={handleExportAll} 
            disabled={isExporting}
            variant="outline"
          >
            {isExporting ? 'Exporting...' : 'Export to Markdown'}
          </Button>
        </div>
      </div>

      {/* Markdown Source of Truth Section */}
      <Card>
        <CardHeader>
          <CardTitle>Markdown Source of Truth</CardTitle>
          <CardDescription>
            Control bidirectional sync between markdown files and database. 
            When active, file changes automatically update the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">File Watcher Status</h3>
              <p className="text-sm text-muted-foreground">
                {watcherStatus?.message || 'Loading...'}
              </p>
            </div>
            <Button
              onClick={handleToggleWatcher}
              variant={watcherStatus?.isRunning ? "destructive" : "default"}
              disabled={startWatcherMutation.isPending || stopWatcherMutation.isPending}
            >
              {watcherStatus?.isRunning ? 'Stop Watcher' : 'Start Watcher'}
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>How it works:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Edit markdown files in the <code>docs/</code> folder with any editor</li>
              <li>Changes are automatically detected and synced to the database</li>
              <li>Supports adding new philosophers, ideas, periods, and relationships</li>
              <li>Use wikilink syntax: <code>[[ideas/theory-of-forms|Theory of Forms]]</code></li>
              <li>Tags are extracted from <code>#tagname</code> format</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* File Management Section */}
      <Card>
        <CardHeader>
          <CardTitle>📁 File Management</CardTitle>
          <CardDescription>
            Manage your markdown files and understand the folder structure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">📂 Folder Structure</h4>
              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded font-mono">
                <div>docs/</div>
                <div className="ml-2">├── philosophers/</div>
                <div className="ml-2">├── ideas/</div>
                <div className="ml-2">├── periods/</div>
                <div className="ml-2">└── relationships/</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">🔗 Syntax Guide</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div><strong>Wikilinks:</strong> <code>[[ideas/categorical-imperative|Categorical Imperative]]</code></div>
                <div><strong>Author links:</strong> <code>[[philosophers/kant|Immanuel Kant]]</code></div>
                <div><strong>Period links:</strong> <code>[[periods/enlightenment|Enlightenment]]</code></div>
                <div><strong>Tags:</strong> <code>#ethics #metaphysics</code></div>
                <div><strong>Relationships:</strong> <code>- **builds_upon**: [[ideas/target|Title]]</code></div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">💡 Best Practices</h4>
            <div className="text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-2 gap-2">
              <ul className="list-disc list-inside space-y-1">
                <li>Use descriptive titles that become good file names</li>
                <li>Add philosopher files before referencing them in ideas</li>
                <li>Create period files before linking to them</li>
                <li>Use consistent naming conventions</li>
              </ul>
              <ul className="list-disc list-inside space-y-1">
                <li>Add relationships in idea files, not separately</li>
                <li>Use tags consistently across related ideas</li>
                <li>Write detailed descriptions in markdown sections</li>
                <li>The file watcher syncs changes automatically</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm">
              <strong>🎯 Quick Start:</strong> Create a philosopher file first, then add their ideas, and finally create relationships between ideas using the markdown syntax above.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <AdminSection
          title="Authors"
          description="Create philosopher markdown files and view synced data"
          id="author"
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          FormComponent={AuthorForm}
          EntriesComponent={AuthorEntries}
        />

        <AdminSection
          title="Periods"
          description="Create historical period markdown files and view synced data"
          id="period"
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          FormComponent={PeriodForm}
          EntriesComponent={PeriodEntries}
        />

        <AdminSection
          title="Tags"
          description="Create tag documentation files (tags are auto-extracted from ideas)"
          id="tag"
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          FormComponent={TagForm}
          EntriesComponent={TagEntries}
        />

        <AdminSection
          title="Ideas"
          description="Create philosophical idea markdown files and view synced data"
          id="idea"
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          FormComponent={IdeaForm}
          EntriesComponent={IdeaEntries}
        />

        <AdminSection
          title="Relationships"
          description="View relationships (edit directly in idea markdown files)"
          id="relationship"
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          FormComponent={RelationshipForm}
          EntriesComponent={RelationshipEntries}
        />
      </div>
    </div>
  );
}

function AdminSection({
  title,
  description,
  id,
  activeSection,
  setActiveSection,
  FormComponent,
  EntriesComponent
}: {
  title: string;
  description: string;
  id: string;
  activeSection: string | null;
  setActiveSection: (id: string | null) => void;
  FormComponent: React.ComponentType;
  EntriesComponent: React.ComponentType;
}) {
  const isActive = activeSection === id;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setActiveSection(isActive ? null : id)}
      >
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="ghost" size="sm">
            {isActive ? 'Close' : 'Manage'}
          </Button>
        </div>
      </CardHeader>

      {isActive && (
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Create {title.slice(0, -1)} File</h3>
            <FormComponent />
          </div>

          <div>
            <h3 className="font-semibold mb-3">Synced {title} (Read-Only)</h3>
            <EntriesComponent />
          </div>
        </CardContent>
      )}
    </Card>
  );
}