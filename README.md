# हिन्दू ग्रन्थालय

A scalable static digital library for Hindu scriptures.

## Current structure

```text
library.json
books/
├── shivamahapurana/
│   ├── metadata.json
│   └── mahatmya/
│       └── chapter-01.json
├── bhagavata-purana/
│   └── metadata.json
└── vishnu-purana/
    └── metadata.json
```

## Planned expansion

Each book is independent:

- Shivamahapurana → Samhita/section → Chapter → Verse
- Bhagavata Purana → Skandha → Chapter → Verse
- Vishnu Purana → Amsha → Chapter → Verse
- More scriptures can be added under `books/` without changing the hosting architecture.

## Editing content

A chapter is one JSON file. The website renders all verses in that chapter on one continuous reading page.

After connecting the repository to Cloudflare Pages through Git integration, commit changes to GitHub and Cloudflare will automatically deploy them.

## Publishing rights

Before publishing a complete modern edition, translation, or commentary, verify that the particular material is public domain or that you have permission to reproduce it.
