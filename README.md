# हिन्दू ग्रन्थालय

A scalable static digital library for Hindu scriptures, designed for simple chapter-by-chapter reading on desktop and mobile.

## Current project

The current published reader contains the **शिवमहापुराण → माहात्म्य** section through Chapter 6.

### शिवमहापुराण — माहात्म्य chapters

| अध्याय | शीर्षक | श्लोक |
|---|---|---:|
| १ | शौनकजीके साधनविषयक प्रश्न करनेपर सूतजीका उन्हें शिवमहापुराणकी महिमा सुनाना | अध्याय १ का पाठ |
| २ | शिवपुराणके श्रवणसे देवराजको शिवलोककी प्राप्ति | अध्याय २ का पाठ |
| ३ | चञ्चुलाका पापसे भय एवं संसारसे वैराग्य | अध्याय ३ का पाठ |
| ४ | चंचुलाकी प्रार्थनासे ब्राह्मणका उसे पूरा शिवपुराण सुनाना और समयानुसार शरीर छोड़कर शिवलोकमें जा चंचुलाका पार्वतीजीकी सखी होना | 50 श्लोक |
| ५ | चंचुलाके प्रयत्नसे पार्वतीजीकी आज्ञा पाकर तुम्बुरुका विन्ध्यपर्वतपर शिवपुराणकी कथा सुनाकर बिन्दुगका पिशाचयोनिसे उद्धार करना तथा उन दोनों दम्पतीका शिवधाममें सुखी होना | 60 श्लोक |
| ६ | शिवपुराणके श्रवणकी विधि | 65 श्लोक |

**वर्तमान परियोजना में अध्याय:** 6  
**अध्याय 6:** 65 श्लोक, 32 अर्थ-खंड, तथा पूर्ण अध्याय-समापन (colophon) सहित।

> अध्याय 1–3 के पुराने JSON डेटा की श्लोक-गिनती को यहाँ जानबूझकर दोहराया नहीं गया है, क्योंकि उन अध्यायों के डेटा पर आगे भी स्रोत-पाठ के साथ मिलान/सुधार किया जा रहा है। README केवल उन अध्यायों की वर्तमान परियोजना-स्थिति और विषय-विवरण दर्ज करता है।

> Note: Chapter titles above are the working titles used by this project. The text is being transcribed and structured chapter-by-chapter; it should not be treated as a critical edition.

## Content structure

```text
hindu-granth-library/
├── index.html
├── styles.css
├── app.js
├── library.json
├── README.md
├── wrangler.jsonc
└── books/
    ├── shivamahapurana/
    │   ├── metadata.json
    │   └── mahatmya/
    │       ├── chapter-01.json
    │       ├── chapter-02.json
    │       ├── chapter-03.json
    │       ├── chapter-04.json
    │       ├── chapter-05.json
    │       └── chapter-06.json
    ├── bhagavata-purana/
    │   └── metadata.json
    └── vishnu-purana/
        └── metadata.json
```

## Chapter JSON model

A chapter is one JSON file and the website renders the whole chapter as one continuous reading page.

Each chapter contains:

- `book`
- `section`
- `chapter`
- `title`
- `source_note`
- `blocks`
- `colophon`

Each `blocks` entry contains:

- `shlokas`: one or more consecutive shlokas
- `meaning`: the Hindi meaning corresponding to that exact group
- `speaker`: optional Sanskrit-section speaker metadata such as `शौनक उवाच` or `सूत उवाच`

### Meaning grouping

The grouping follows the source meaning rather than forcing one meaning per shloka. For example, if the printed Hindi meaning covers shlokas 1–2 together, the JSON keeps them together as one block.

The original Hindi meaning text is preserved, including source wording such as:

- `शौनकजी बोले—`
- `सूतजी बोले—`
- `चंचुला बोली—`
- `पार्वतीजी बोलीं—`
- `गिरिजा बोलीं—`

These speaker introductions are part of the meaning text and must not be removed merely because a separate `speaker` field exists.

## Sanskrit line breaks

Each shloka stores explicit `lines` rather than relying on a browser-generated line wrap.

This is intentional because a printed shloka may occupy two, three, or four lines depending on the source edition. The reader should preserve the supplied printed line structure.

There is no duplicate `sanskrit` field; `lines` is the canonical Sanskrit display data.

## Chapter 6 notes

Chapter 6 is **श्रवणविधिवर्णनम्** — the procedure for listening to the Shiva Purana. It contains 65 shlokas. Its Hindi meaning is stored in grouped blocks matching the supplied meaning ranges, including the final colophon.

The Chapter 6 Sanskrit was checked against available online transcriptions while retaining the user's supplied working text where wording differs. Some source websites themselves contain OCR/transcription variants, so further comparison against the printed source is appropriate before treating any verse as definitive.

## UI / reading principles

- One chapter = one continuous page
- Chapter navigation, not verse-by-verse page navigation
- Large Devanagari Sanskrit text
- Sanskrit shlokas use the project's dark saffron-brown styling and bold weight
- Printed Sanskrit line breaks are preserved
- Hindi meaning is visually separated from Sanskrit
- Meaning text retains source speaker introductions
- Mobile-friendly layout
- Search within the current chapter
- A / A+ reading control adjusts reading size
- No advertising in the current static reader

## Future expansion

Each book is independent:

- Shivamahapurana → Samhita/section → Chapter → Verse
- Bhagavata Purana → Skandha → Chapter → Verse
- Vishnu Purana → Amsha → Chapter → Verse
- Bhagavad Gita, Ramayana, Mahabharata, Upanishads, stotras, sahasranamas and other texts can be added later under `books/` without changing the hosting architecture.

## Updating the website

The project is designed for GitHub + Cloudflare Pages Git integration.

1. Replace/add the relevant JSON files in the repository.
2. Update the relevant `metadata.json` chapter list.
3. Commit and push to the `main` branch.
4. Cloudflare Pages automatically deploys the new commit.

Keep `index.html` at the repository root. Do not put the project folder one level deeper inside the GitHub repository.

## Source and transcription policy

The current chapters are a working digital transcription assembled from user-provided source material and cross-checks against available online transcriptions where useful. Sanskrit spellings, punctuation, line breaks, and Hindi meaning should be checked against the intended printed edition before calling the site a definitive edition.

## Publishing rights

Ancient scriptural works may be public domain, but a particular modern printed edition, translation, commentary, editorial material, typography, or compilation can have separate rights. Before publishing a complete modern edition or translation, verify that the specific material is public domain, licensed, or otherwise permitted for reproduction.

## Project status

**Current:** Shivamahapurana → माहात्म्य → Chapters 1–6 available in the project data.  
**Next:** Continue adding later chapters and additional granthas while keeping the same structured data model.
