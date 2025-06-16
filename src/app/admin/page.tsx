"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthorForm, PeriodForm, TagForm, IdeaForm, RelationshipForm } from "@/components/forms";
import { AuthorEntries, PeriodEntries, TagEntries, IdeaEntries, RelationshipEntries } from "@/components/entries";

export default function AdminPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin Panel</h1>

      <div className="space-y-4">
        <AdminSection
          title="Authors"
          description="Manage philosophical authors"
          id="author"
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          FormComponent={AuthorForm}
          EntriesComponent={AuthorEntries}
        />

        <AdminSection
          title="Periods"
          description="Manage historical periods"
          id="period"
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          FormComponent={PeriodForm}
          EntriesComponent={PeriodEntries}
        />

        <AdminSection
          title="Tags"
          description="Manage categorization tags"
          id="tag"
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          FormComponent={TagForm}
          EntriesComponent={TagEntries}
        />

        <AdminSection
          title="Ideas"
          description="Manage philosophical ideas"
          id="idea"
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          FormComponent={IdeaForm}
          EntriesComponent={IdeaEntries}
        />

        <AdminSection
          title="Relationships"
          description="Manage idea relationships"
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
            <h3 className="font-semibold mb-3">Add New {title.slice(0, -1)}</h3>
            <FormComponent />
          </div>

          <div>
            <h3 className="font-semibold mb-3">Existing {title}</h3>
            <EntriesComponent />
          </div>
        </CardContent>
      )}
    </Card>
  );
}