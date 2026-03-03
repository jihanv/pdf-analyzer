# PDF/Text Vocabulary Extractor + Dictionary Lookup (React + Zustand)

A small React/TypeScript UI that lets you **upload a PDF** or **paste text**, then:

1. extracts words,
2. filters them against a custom dictionary + stopwords,
3. shows **word frequency counts**,
4. lets you **lookup per-word definitions** (Japanese or English) inline.

---

## What it does

- **Two input modes**
  - **Paste Text** (textarea)
  - **Upload PDF** (PDF-to-text in the browser)

- **Word analysis**
  - Normalizes to lowercase
  - Strips punctuation/symbols
  - Filters by:
    - stopwords list
    - your dictionary list (only words contained in it)
    - length > 3
    - excludes pure numbers
  - Produces a **count per unique word**

- **Inline dictionary lookup**
  - Each word row has a **Lookup** toggle
  - Expands a details panel with definitions
  - Per-word language switch: **Japanese (`ja`) / English (`en`)**
  - Tries simple fallback variants (plural/past/gerund/comparative, etc.) and shows the matched form as `一致形: ...` when applicable

---

## Tech stack

- React + TypeScript
- Zustand (global state)
- `react-pdftotext` (PDF → text extraction in the browser)
- A backend/proxy lookup endpoint (currently hard-coded as an AWS Lambda URL)

---

## Getting started

> These commands assume a typical Vite + React setup.

1. Install dependencies:
   ```bash
   npm install
   ```
