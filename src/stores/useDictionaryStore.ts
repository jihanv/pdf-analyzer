import { create } from "zustand";
import pdfToText from "react-pdftotext";

type DictionaryStore = {
  // File management
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;

  // Dictionary words
  dictionary: Set<string>;
  setDictionary: (words: string[]) => void;

  // Global loading for PDF processing
  loading: boolean;
  setLoading: (value: boolean) => void;

  // Extracted word counts
  wordCounts: Record<string, number>;
  setWordCounts: (counts: Record<string, number>) => void;

  // Per-word loading states
  lookupLoading: Set<string>;
  addLookupLoading: (word: string) => void;
  removeLookupLoading: (word: string) => void;

  // Expanded rows (multiple)
  expandedWords: Set<string>;
  openLookup: (word: string) => Promise<void>;
  closeLookup: (word: string) => void;

  // Lookup results
  lookupData: Record<string, string[]>;
  setLookupData: (word: string, data: string[]) => void;

  // Extract text from PDF
  extractText: (file: File, stopwords: string[]) => Promise<void>;
};

export const useDictionaryStore = create<DictionaryStore>((set, get) => ({
  // File management
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),

  // Dictionary words
  dictionary: new Set(),
  setDictionary: (words) => set({ dictionary: new Set(words) }),

  // Global loading for PDF processing
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

  // Expanded rows (multiple)
  expandedWords: new Set(),

  openLookup: async (word: string) => {
    const {
      expandedWords,
      lookupData,
      setLookupData,
      addLookupLoading,
      removeLookupLoading,
    } = get();

    if (expandedWords.has(word)) return;

    const newSet = new Set(expandedWords);
    newSet.add(word);
    set({ expandedWords: newSet });

    if (lookupData[word]) return;

    addLookupLoading(word);

    // --- Helper: generate fallback variants ---
    const generateVariants = (w: string): string[] => {
      const variants = new Set<string>();
      const lower = w.toLowerCase();
      variants.add(lower);

      // Plurals
      if (lower.endsWith("ies")) variants.add(lower.slice(0, -3) + "y");
      if (lower.endsWith("ves")) {
        variants.add(lower.slice(0, -3) + "f");
        variants.add(lower.slice(0, -3) + "fe");
      }
      if (lower.endsWith("es")) variants.add(lower.slice(0, -2));
      if (lower.endsWith("s")) variants.add(lower.slice(0, -1));

      // Past tense
      if (lower.endsWith("ied")) variants.add(lower.slice(0, -3) + "y");
      if (lower.endsWith("ed")) {
        variants.add(lower.slice(0, -2));
        variants.add(lower.slice(0, -1));
      }

      // Present participle
      if (lower.endsWith("ing")) {
        variants.add(lower.slice(0, -3)); // remove "ing"
        variants.add(lower.slice(0, -3) + "e"); // replace with "e"
      }

      // Comparative / superlative
      if (lower.endsWith("ier")) variants.add(lower.slice(0, -3) + "y");
      if (lower.endsWith("iest")) variants.add(lower.slice(0, -4) + "y");
      if (lower.endsWith("er")) variants.add(lower.slice(0, -2));
      if (lower.endsWith("est")) variants.add(lower.slice(0, -3));

      return Array.from(variants);
    };

    // --- Helper: API fetch + parse ---

    // const fetchDefinitions = async (query: string): Promise<string[]> => {
    //   const response = await fetch(
    //     `https://api.allorigins.win/raw?url=${encodeURIComponent(
    //       `https://api.excelapi.org/dictionary/enja?word=${query}`
    //     )}`,
    //     { headers: { Accept: "text/plain", "User-Agent": "Mozilla/5.0" } }
    //   );

    //   const text = await response.text();
    //   const cleanText = text
    //     .replace(/^\uFEFF/, "")
    //     .replace(/[‘’]/g, "'")
    //     .replace(/[“”]/g, '"')
    //     .replace(/[\u0000-\u001F\u007F]/g, "")
    //     .replace(/\u3000/g, " ") // replace Japanese full-width spaces with normal space
    //     .trim();

    //   let definitions = cleanText
    //     .split(/\s*\/\s*/) // split on slashes for top-level senses
    //     .map((def) => def.trim())
    //     .filter((def) => def.replace(/\s/g, "").length > 0); // only drop truly blank strings

    //   // If somehow still nothing, fallback to raw
    //   if (definitions.length === 0 && cleanText.length > 0) {
    //     definitions = [cleanText];
    //   }

    //   return definitions;
    // };

    const fetchDefinitions = async (query: string): Promise<string[]> => {
      const response = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(
          `https://api.excelapi.org/dictionary/enja?word=${query}`
        )}`,
        { headers: { Accept: "text/plain", "User-Agent": "Mozilla/5.0" } }
      );

      const text = await response.text();
      const cleanText = text
        .replace(/^\uFEFF/, "")
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/[\u0000-\u001F\u007F]/g, "")
        .replace(/\u3000/g, " ") // normalize full-width spaces
        .trim();

      // Split first by "/"
      const rawDefs = cleanText.split(/\s*\/\s*/).map((d) => d.trim());

      // Then split each chunk by commas or semicolons (sub-senses)
      let definitions: string[] = rawDefs.flatMap((def) =>
        def
          .split(/[;,]/)
          .map((sub) => sub.trim())
          .filter((s) => s.length > 0)
      );

      if (definitions.length === 0 && cleanText.length > 0) {
        definitions = [cleanText];
      }

      return definitions;
    };

    try {
      // 1. Try the original word first
      let definitions = await fetchDefinitions(word);

      // 2. If that fails, try variants
      if (definitions.length === 0) {
        const variants = generateVariants(word);
        for (const variant of variants) {
          if (variant === word.toLowerCase()) continue; // skip original
          const defs = await fetchDefinitions(variant);
          if (defs.length > 0) {
            definitions = defs;
            break; // stop at first successful match
          }
        }
      }

      setLookupData(word, definitions);
    } catch (err) {
      console.error("Lookup failed:", err);
      setLookupData(word, []);
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
  setLookupData: (word, data) =>
    set((state) => ({
      lookupData: { ...state.lookupData, [word]: data },
    })),

  // Extract text from PDF
  extractText: async (file: File, stopwords: string[]) => {
    const { dictionary, setLoading, setWordCounts } = get();
    setLoading(true);
    try {
      let text = await pdfToText(file);
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
      setWordCounts(results); // <-- Save globally
    } catch (err) {
      console.error("Text extraction failed", err);
      setWordCounts({});
    } finally {
      setLoading(false);
    }
  },
}));
