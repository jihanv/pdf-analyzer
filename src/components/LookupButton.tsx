import { useDictionaryStore } from "../stores/useDictionaryStore";

export default function LookupButton({ word }: { word: string }) {


    const expandedWords = useDictionaryStore((state) => state.expandedWords);

    const openLookup = useDictionaryStore((state) => state.openLookup);
    const closeLookup = useDictionaryStore((state) => state.closeLookup);
    return (
        <button
            style={{
                padding: "2px 6px",
                fontSize: "0.8rem",
                cursor: "pointer",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "3px",
                width: "70px",
                textAlign: "center"
            }}
            onClick={() =>
                expandedWords.has(word)
                    ? closeLookup(word)
                    : openLookup(word)
            }
        >
            {expandedWords.has(word) ? "Close" : "Lookup"}
        </button>
    )
}
