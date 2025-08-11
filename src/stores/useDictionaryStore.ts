import { create } from "zustand";

type DefinitionLanguage = "ja" | "en";

type DictionaryStore = {
  // File management
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;

  // Pasted text management
  pastedText: string;
  setPastedText: (text: string) => void;

  // Dictionary words
  dictionary: Set<string>;
  setDictionary: (words: string[]) => void;

  // Global loading for PDF/text processing
  loading: boolean;
  setLoading: (value: boolean) => void;

  // Extracted word counts
  wordCounts: Record<string, number>;
  setWordCounts: (counts: Record<string, number>) => void;

  // Per-word loading states
  lookupLoading: Set<string>;
  addLookupLoading: (word: string) => void;
  removeLookupLoading: (word: string) => void;

  // Expanded rows
  expandedWords: Set<string>;
  openLookup: (word: string) => Promise<void>;
  closeLookup: (word: string) => void;

  // Lookup results (now stores by language)
  lookupData: Record<string, { ja?: string[]; en?: string[] }>;
  setLookupData: (
    word: string,
    lang: DefinitionLanguage,
    data: string[]
  ) => void;

  // Matched variant tracking
  lookupVariants: Record<string, string | null>;
  setLookupVariant: (word: string, variant: string | null) => void;

  // Per-word language preference
  wordDefinitionLanguage: Record<string, DefinitionLanguage>;
  setWordDefinitionLanguage: (word: string, lang: DefinitionLanguage) => void;

  // Extract text from PDF or pasted text
  extractText: (input: File | string, stopwords: string[]) => Promise<void>;

  inputMode: "pdf" | "text";
  setInputMode: (mode: "pdf" | "text") => void;
};

export const useDictionaryStore = create<DictionaryStore>((set, get) => ({
  // File management
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),

  // Pasted text
  pastedText: "",
  setPastedText: (text) => set({ pastedText: text }),

  // Dictionary words
  dictionary: new Set(),
  setDictionary: (words) => set({ dictionary: new Set(words) }),

  // Global loading
  loading: false,
  setLoading: (value) => set({ loading: value }),

  // Extracted word counts
  wordCounts: {},
  setWordCounts: (counts) => set({ wordCounts: counts }),

  // Per-word loading states
  lookupLoading: new Set(),
  addLookupLoading: (word) =>
    set((state) => {
      const newSet = new Set(state.lookupLoading);
      newSet.add(word);
      return { lookupLoading: newSet };
    }),
  removeLookupLoading: (word) =>
    set((state) => {
      const newSet = new Set(state.lookupLoading);
      newSet.delete(word);
      return { lookupLoading: newSet };
    }),

  // Expanded rows
  expandedWords: new Set(),
  openLookup: async (word: string) => {
    const {
      expandedWords,
      lookupData,
      setLookupData,
      addLookupLoading,
      removeLookupLoading,
      setLookupVariant,
      wordDefinitionLanguage,
    } = get();
    const lang = wordDefinitionLanguage[word] || "ja";

    if (expandedWords.has(word)) {
      // Still allow re-fetch for different language
      if (lookupData[word]?.[lang]) return;
    }

    const newSet = new Set(expandedWords);
    newSet.add(word);
    set({ expandedWords: newSet });

    addLookupLoading(word);

    // --- Generate fallback variants ---
    const generateVariants = (w: string): string[] => {
      const variants = new Set<string>();
      const lower = w.toLowerCase();
      variants.add(lower);

      // plural → singular
      if (lower.endsWith("ies")) variants.add(lower.slice(0, -3) + "y");
      if (lower.endsWith("ves")) {
        variants.add(lower.slice(0, -3) + "f");
        variants.add(lower.slice(0, -3) + "fe");
      }
      if (lower.endsWith("es")) variants.add(lower.slice(0, -2));
      if (lower.endsWith("s")) variants.add(lower.slice(0, -1));

      // past tense
      if (lower.endsWith("ied")) variants.add(lower.slice(0, -3) + "y");
      if (lower.endsWith("ed")) {
        variants.add(lower.slice(0, -2));
        variants.add(lower.slice(0, -1));
      }

      // present participle
      if (lower.endsWith("ing")) {
        variants.add(lower.slice(0, -3)); // remove "ing"
        variants.add(lower.slice(0, -3) + "e"); // replace with "e"
      }

      // comparatives/superlatives
      if (lower.endsWith("ier")) variants.add(lower.slice(0, -3) + "y");
      if (lower.endsWith("iest")) variants.add(lower.slice(0, -4) + "y");
      if (lower.endsWith("er")) variants.add(lower.slice(0, -2));
      if (lower.endsWith("est")) variants.add(lower.slice(0, -3));

      return Array.from(variants);
    };

    // --- Fetch definitions based on language ---
    const fetchDefinitions = async (
      query: string,
      lang: DefinitionLanguage
    ): Promise<string[]> => {
      if (lang === "ja") {
        // Japanese: existing API
        const response = await fetch(
          `https://corsproxy.io/?${encodeURIComponent(
            `https://api.excelapi.org/dictionary/enja?word=${query}`
          )}`,
          { headers: { Accept: "text/plain", "User-Agent": "Mozilla/5.0" } }
        );
        const text = await response.text();
        const cleanText = text
          .replace(/^\uFEFF/, "")
          .replace(/[‘’]/g, "'")
          .replace(/[“”]/g, '"')
          .replace(/\u3000/g, " ")
          .trim();
        return cleanText.length > 0 ? [cleanText] : [];
      } else {
        // English: dictionaryapi.dev
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
            query
          )}`
        );
        if (!response.ok) return ["No results found."];
        const data = await response.json();
        if (!Array.isArray(data)) return ["No results found."];

        // Extract formatted strings: Part of speech + definition + example
        // Group by part of speech
        const grouped: Record<string, string[]> = {};
        for (const entry of data) {
          for (const meaning of entry.meanings || []) {
            const pos = meaning.partOfSpeech || "unknown";
            for (const def of meaning.definitions || []) {
              let formatted = def.definition;
              if (def.example) formatted += `\n   e.g., "${def.example}"`;
              if (!grouped[pos]) grouped[pos] = [];
              grouped[pos].push(formatted);
            }
          }
        }

        // Convert to array with headers
        const definitions: string[] = [];
        for (const [pos, defs] of Object.entries(grouped)) {
          definitions.push(`**${pos}**`);
          defs.forEach((d) => definitions.push(d));
        }
        return definitions.length > 0 ? definitions : ["No results found."];
      }
    };

    try {
      // 1. Try the original
      let definitions = await fetchDefinitions(word, lang);
      let usedVariant: string | null = null;

      // 2. If empty, try variants
      if (definitions.length === 0) {
        const variants = generateVariants(word);
        for (const variant of variants) {
          if (variant === word.toLowerCase()) continue;
          const defs = await fetchDefinitions(variant, lang);
          if (defs.length > 0) {
            definitions = defs;
            usedVariant = variant;
            break;
          }
        }
      }

      // 3. Log & store which variant worked
      if (usedVariant) {
        console.log(
          `Lookup for "${word}" succeeded with variant "${usedVariant}".`
        );
        setLookupVariant(word, usedVariant);
      } else {
        setLookupVariant(word, null);
        if (definitions.length === 0) {
          console.log(`Lookup for "${word}" returned no results.`);
        }
      }

      // 4. Fallback if still nothing
      if (definitions.length === 0) {
        definitions = ["No results found."];
      }

      setLookupData(word, lang, definitions);
    } catch (err) {
      console.error("Lookup failed:", err);
      setLookupData(word, lang, ["No results found."]);
      setLookupVariant(word, null);
    } finally {
      removeLookupLoading(word);
    }
  },
  closeLookup: (word: string) => {
    const { expandedWords } = get();
    const newSet = new Set(expandedWords);
    newSet.delete(word);
    set({ expandedWords: newSet });
  },

  // Lookup results
  lookupData: {},
  setLookupData: (word, lang, data) =>
    set((state) => ({
      lookupData: {
        ...state.lookupData,
        [word]: { ...state.lookupData[word], [lang]: data },
      },
    })),

  // Matched variants
  lookupVariants: {},
  setLookupVariant: (word, variant) =>
    set((state) => ({
      lookupVariants: { ...state.lookupVariants, [word]: variant },
    })),

  // Per-word language selection
  wordDefinitionLanguage: {},
  setWordDefinitionLanguage: (word, lang) => {
    const { openLookup } = get();
    set((state) => ({
      wordDefinitionLanguage: { ...state.wordDefinitionLanguage, [word]: lang },
    }));
    openLookup(word); // auto-fetch when language changes
  },

  // Extract text from PDF or pasted text
  extractText: async (input: File | string, stopwords: string[]) => {
    const { dictionary, setLoading, setWordCounts } = get();
    setLoading(true);
    try {
      let text = "";
      if (typeof input === "string") {
        text = input; // pasted text
      } else {
        const pdfToText = (await import("react-pdftotext")).default;
        text = await pdfToText(input);
      }
      text = text.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ");
      let words = text.split(/\s+/).filter(Boolean);

      words = words.filter(
        (word) =>
          !stopwords.includes(word) &&
          dictionary.has(word) &&
          !/^\d+$/.test(word) &&
          word.length > 3
      );

      const wordCount = new Map<string, number>();
      words.forEach((word) => {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      });

      const results = Object.fromEntries(wordCount);
      setWordCounts(results);
    } catch (err) {
      console.error("Text extraction failed", err);
      setWordCounts({});
    } finally {
      setLoading(false);
    }
  },

  inputMode: "text",
  setInputMode: (mode) => {
    if (mode === "pdf") {
      set({ inputMode: mode, pastedText: "" }); // clear text when switching to PDF
    } else {
      set({ inputMode: mode, selectedFile: null }); // clear file when switching to Text
    }
  },
}));
