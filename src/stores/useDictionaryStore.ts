import { create } from "zustand";
import pdfToText from "react-pdftotext";

type DictionaryStore = {
  dictionary: Set<string>;
  setDictionary: (words: string[]) => void;

  loading: boolean;
  setLoading: (value: boolean) => void;

  lookupLoading: Set<string>;
  addLookupLoading: (word: string) => void;
  removeLookupLoading: (word: string) => void;

  expandedWords: Set<string>;
  openLookup: (word: string) => Promise<void>;
  closeLookup: (word: string) => void;

  lookupData: Record<string, string[]>;
  setLookupData: (word: string, data: string[]) => void;

  extractText: (
    file: File,
    stopwords: string[]
  ) => Promise<Record<string, number>>;
};

export const useDictionaryStore = create<DictionaryStore>((set, get) => ({
  // Dictionary words
  dictionary: new Set(),
  setDictionary: (words) => set({ dictionary: new Set(words) }),

  // Global loading for PDF processing
  loading: false,
  setLoading: (value) => set({ loading: value }),

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

    // If already open, do nothing
    if (expandedWords.has(word)) return;

    // Open this word
    const newSet = new Set(expandedWords);
    newSet.add(word);
    set({ expandedWords: newSet });

    // If already fetched, no need to fetch again
    if (lookupData[word]) return;

    // Fetch data for this word
    addLookupLoading(word);
    try {
      const response = await fetch(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(
          `https://api.excelapi.org/dictionary/enja?word=${word}`
        )}`,
        {
          headers: { Accept: "text/plain", "User-Agent": "Mozilla/5.0" },
        }
      );
      const text = await response.text();
      const definitions = text
        .split("/")
        .map((def) => def.trim())
        .filter(Boolean);
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
    const { dictionary, setLoading } = get();
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

      return Object.fromEntries(wordCount);
    } catch (err) {
      console.error("Text extraction failed", err);
      return {};
    } finally {
      setLoading(false);
    }
  },
}));
