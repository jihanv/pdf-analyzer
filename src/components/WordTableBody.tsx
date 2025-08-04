// components/WordTableBody.tsx
import LookupButton from "./LookupButton";
import { useDictionaryStore } from "../stores/useDictionaryStore";

export default function WordTableBody() {
    const wordCounts = useDictionaryStore((state) => state.wordCounts);
    const expandedWords = useDictionaryStore((state) => state.expandedWords);
    const lookupLoading = useDictionaryStore((state) => state.lookupLoading);
    const lookupData = useDictionaryStore((state) => state.lookupData);
    const lookupVariants = useDictionaryStore((state) => state.lookupVariants);
    const wordDefinitionLanguage = useDictionaryStore((state) => state.wordDefinitionLanguage);
    const setWordDefinitionLanguage = useDictionaryStore((state) => state.setWordDefinitionLanguage);

    return (
        <>
            {Object.entries(wordCounts).map(([word, count], index) => {
                const wordLang = wordDefinitionLanguage[word] || "ja";
                const definitions = lookupData[word]?.[wordLang] || [];

                return (
                    <>
                        <tr
                            key={`${word}-row`}
                            style={{
                                backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff"
                            }}
                        >
                            <td style={{ padding: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <LookupButton word={word} />
                                <span>{word}</span>
                                {lookupLoading.has(word) && (
                                    <span style={{ marginLeft: "8px", fontSize: "0.8rem", color: "#666" }}>
                                        Loading...
                                    </span>
                                )}
                            </td>
                            <td style={{ padding: "8px", textAlign: "right" }}>{count}</td>
                        </tr>
                        {expandedWords.has(word) && (
                            <tr key={`${word}-expanded`}>
                                <td colSpan={2} style={{ padding: "8px", background: "#eef" }}>
                                    {lookupLoading.has(word) ? (
                                        <div style={{ padding: "8px", color: "#666" }}>Loading definitions...</div>
                                    ) : definitions.length > 0 ? (
                                        <div>
                                            <strong style={{ fontSize: "1.1rem" }}>{word}</strong>
                                            {lookupVariants[word] && lookupVariants[word] !== word.toLowerCase() && (
                                                <div
                                                    style={{
                                                        display: "inline-block",
                                                        marginLeft: "8px",
                                                        background: "#444",
                                                        color: "#fff",
                                                        padding: "2px 8px",
                                                        borderRadius: "12px",
                                                        fontSize: "0.8rem"
                                                    }}
                                                >
                                                    一致形: {lookupVariants[word]}
                                                </div>
                                            )}

                                            {/* Per-word language toggle */}
                                            <div style={{ marginTop: "6px" }}>
                                                <label style={{ marginRight: "8px" }}>
                                                    <input
                                                        type="radio"
                                                        name={`lang-${word}`}
                                                        value="ja"
                                                        checked={wordLang === "ja"}
                                                        onChange={() => setWordDefinitionLanguage(word, "ja")}
                                                    />
                                                    Japanese
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        name={`lang-${word}`}
                                                        value="en"
                                                        checked={wordLang === "en"}
                                                        onChange={() => setWordDefinitionLanguage(word, "en")}
                                                    />
                                                    English
                                                </label>
                                            </div>

                                            {/* Definitions list */}
                                            <div style={{ marginTop: "8px" }}>
                                                {definitions.map((def: string, i: number) => {
                                                    // Bold header for part of speech
                                                    if (def.startsWith("**") && def.endsWith("**")) {
                                                        return (
                                                            <div key={i} style={{ fontWeight: "bold", marginTop: "6px" }}>
                                                                {def.replace(/\*\*/g, "")}
                                                            </div>
                                                        );
                                                    }
                                                    // Style examples (lines with "e.g.,")
                                                    const [main, example] = def.split("\n");
                                                    return (
                                                        <div key={i} style={{ marginLeft: "12px", marginBottom: "4px" }}>
                                                            {main}
                                                            {example && (
                                                                <div style={{ fontStyle: "italic", color: "#555", marginTop: "2px" }}>
                                                                    {example.trim()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        "No results found."
                                    )}
                                </td>
                            </tr>
                        )}
                    </>
                );
            })}
        </>
    );
}
