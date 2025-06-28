# Philosophical Timeline Documentation

This directory contains the complete philosophical timeline database in markdown format.

## 🎯 **This is now the SOURCE OF TRUTH**

All changes should be made to these markdown files. The database will automatically sync from these files when the file watcher is active.

## 📁 Directory Structure

- `philosophers/` - Individual philosopher profiles with biographical data and their ideas
- `ideas/` - Philosophical concepts with descriptions, relationships, and tags  
- `periods/` - Historical periods with context and major thinkers
- `index.md` - Overview and navigation hub

## ✏️ How to Edit

1. **Start the file watcher** in the admin panel (http://localhost:3001/admin)
2. **Edit any .md file** with your preferred editor (VS Code, Obsidian, vim, etc.)
3. **Save the file** - changes automatically sync to the database
4. **Use wikilinks** to cross-reference: `[[philosophers/plato|Plato]]`
5. **Add tags** with hashtags: `#Ethics #Metaphysics`

## 🔗 Wikilink Format

- Philosophers: `[[philosophers/plato|Plato]]`
- Ideas: `[[ideas/theory-of-forms|Theory of Forms]]`  
- Periods: `[[periods/ancient-philosophy|Ancient Philosophy]]`

## 🏷️ Tag Format

Use hashtags in content: `#Ethics`, `#Metaphysics`, `#Existentialism`

## 📋 Frontmatter Fields

### Philosophers
```yaml
---
name: Plato
birth: 428 BCE
death: 348 BCE  
nationality: Greek
---
```

### Ideas
```yaml
---
title: Theory of Forms
author: Plato
year: -380
period: Ancient Philosophy
tags:
  - Metaphysics
  - Epistemology
---
```

### Periods
```yaml
---
name: Ancient Philosophy
start: 600 BCE
end: 600 CE
description: The foundation of Western philosophy...
---
```

## 🔄 Sync Status

- ✅ **Export**: Database → Markdown (completed)
- 🔄 **Import**: Markdown → Database (enable file watcher)
- 🎯 **Source of Truth**: Markdown files

## 🚀 Getting Started

1. Enable the file watcher in admin panel
2. Open this directory in your favorite editor
3. Start editing - changes sync automatically!
4. Use the web interface to view and search your content

---

Generated: 6/27/2025, 10:41:37 PM
Total Files: 37
