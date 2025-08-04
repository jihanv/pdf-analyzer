// components/WordTableBody.tsx
import LookupButton from "./LookupButton";
import { useDictionaryStore } from "../stores/useDictionaryStore";

export default function WordTableBody() {
    const wordCounts = useDictionaryStore((state) => state.wordCounts);
    const expandedWords = useDictionaryStore((state) => state.expandedWords);
    const lookupLoading = useDictionaryStore((state) => state.lookupLoading);
    const lookupData = useDictionaryStore((state) => state.lookupData);

    return (
        <>
            {Object.entries(wordCounts).map(([word, count], index) => (
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
                                {lookupData[word] && lookupData[word].length > 0 && (
                                    <div>
                                        <strong>{word}</strong>
                                        <ul>
                                            {lookupData[word].map((def: string, i: number) => (
                                                <li key={i}>{def}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {lookupData[word] && lookupData[word].length === 0 && "No results found."}
                            </td>
                        </tr>
                    )}
                </>
            ))}
        </>
    );
}
