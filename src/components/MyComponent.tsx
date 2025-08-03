import { useState, useEffect } from "react";
import stopwordsJson from "../lib/stopwords.json";
const stopwords: string[] = stopwordsJson.stopwords;
import { useDictionaryStore } from "../stores/useDictionaryStore";

export default function MyComponent() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
    const dictionary = useDictionaryStore((state) => state.dictionary);
    const setDictionary = useDictionaryStore((state) => state.setDictionary);
    const uniqueWords = Object.keys(wordCounts).length;

    const loading = useDictionaryStore((state) => state.loading);
    const lookupLoading = useDictionaryStore((state) => state.lookupLoading);
    const expandedWords = useDictionaryStore((state) => state.expandedWords);

    const lookupData = useDictionaryStore((state) => state.lookupData);
    const openLookup = useDictionaryStore((state) => state.openLookup);
    const closeLookup = useDictionaryStore((state) => state.closeLookup);
    const extractText = useDictionaryStore((state) => state.extractText);

    // Load dictionary on mount
    useEffect(() => {
        async function loadDictionary() {
            try {
                const response = await fetch(`${import.meta.env.BASE_URL}dictionary.json`);
                if (!response.ok) throw new Error("Failed to load dictionary");
                const data = await response.json();
                setDictionary(data.dictionary);
            } catch (err) {
                console.error("Failed to load dictionary:", err);
            }
        }
        loadDictionary();
    }, [setDictionary]);

    // Process PDF and extract words
    const processFile = async () => {
        if (!selectedFile) return;
        const results = await extractText(selectedFile, stopwords);
        setWordCounts(results);
    };

    return (
        <div className="upload-container">
            <h2>Personal Dictionary</h2>
            <p>Upload a PDF file and get all the words</p>

            <div
                className="drop-zone"
                onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.length) setSelectedFile(e.dataTransfer.files[0]);
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("fileInput")?.click()}
            >
                <input
                    id="fileInput"
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                        if (e.target.files?.length) setSelectedFile(e.target.files[0]);
                    }}
                    style={{ display: "none" }}
                />
                <button className="upload-btn">
                    {selectedFile ? "Change PDF File" : "Select PDF File"}
                </button>
                <p className="small-text">or drag and drop here</p>
            </div>

            <button
                className="process-btn"
                onClick={processFile}
                disabled={!selectedFile || loading || dictionary.size === 0}
            >
                {loading
                    ? "Processing..."
                    : selectedFile
                        ? <>Process <strong>{selectedFile.name}</strong></>
                        : "Process PDF"}
            </button>

            <div className="results">
                {uniqueWords > 0 && <p><strong>Unique words:</strong> {uniqueWords}</p>}
                {uniqueWords === 0 && !loading ? (
                    "No data yet."
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left", borderBottom: "2px solid #ccc", padding: "8px" }}>Word</th>
                                <th style={{ textAlign: "right", borderBottom: "2px solid #ccc", padding: "8px" }}>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(wordCounts).map(([word, count], index) => (
                                <>
                                    <tr
                                        key={`${word}-row`}
                                        style={{
                                            backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff"
                                        }}
                                    >
                                        <td style={{ padding: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
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
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
