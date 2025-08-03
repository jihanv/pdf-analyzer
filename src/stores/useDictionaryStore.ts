import { create } from "zustand";

import pdfToText from "react-pdftotext";

type DictionaryStore = {
  dictionary: Set<string>;
  setDictionary: (words: string[]) => void;

  loading: boolean;
  setLoading: (value: boolean) => void;

  lookupLoading: boolean;
  setLookupLoading: (value: boolean) => void;

  expandedWord: string | null;
  setExpandedWord: (word: string | null) => void;

  lookupData: Record<string, string[]>;
  setLookupData: (word: string, data: string[]) => void;

  handleLookup: (word: string) => Promise<void>;
  extractText: (
    file: File,
    stopwords: string[]
  ) => Promise<Record<string, number>>;
};

export const useDictionaryStore = create<DictionaryStore>((set, get) => ({
  dictionary: new Set(),
  setDictionary: (words) => set({ dictionary: new Set(words) }),

  loading: false,
  setLoading: (value) => set({ loading: value }),

  lookupLoading: false,
  setLookupLoading: (value) => set({ lookupLoading: value }),

  expandedWord: null,
  setExpandedWord: (word) => set({ expandedWord: word }),

  lookupData: {},
  setLookupData: (word, data) =>
    set((state) => ({
      lookupData: { ...state.lookupData, [word]: data },
    })),

  handleLookup: async (word: string) => {
    const {
      expandedWord,
      setExpandedWord,
      lookupData,
      setLookupLoading,
      setLookupData,
    } = get();
    if (expandedWord === word) {
      setExpandedWord(null);
      return;
    }
    setExpandedWord(word);
    if (!lookupData[word]) {
      setLookupLoading(true);
      try {
        const response = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(
            `https://api.excelapi.org/dictionary/enja?word=${word}`
          )}`,
          {
            headers: {
              Accept: "text/plain",
              "User-Agent": "Mozilla/5.0",
            },
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
        setLookupLoading(false);
      }
    }
  },

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
