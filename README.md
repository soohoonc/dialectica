#  dialectica

discussions of humanity

## Architecture

This is a fancy UI layer on top of a markdown/obsidian vault directory.
It is optimized to show a conversational thread of human history.

We define 4 objects:
- Figures: the who
- Periods: the when
- Locations: the where
- Ideas: the what and why

### Figure
```markdown
id: `fg_${x:string}`
birth: Date
death: Date
nationality: Nation
gender: Gender
parent: Figure
children: Figure[]
```

### Period
```markdown
id: `pr_${x:string}`
start: Date
end: Date
name: string
location?: Location
parent: Period
children: Period[]
```

### Location
```markdown
id: `lc_${x:string}`
name: string
period?: Period
parent: Location
children: Location[]
```

### Idea
```markdown
id: `id_${x:string}`
name: string
author: Figure
period: Period
location?: Location
parent: Idea
children: Idea[]
```