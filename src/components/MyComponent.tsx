import { useState, useEffect } from "react";
import stopwordsJson from "../lib/stopwords.json";
const stopwords: string[] = stopwordsJson.stopwords;

export default function MyComponent() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [dictionary, setDictionary] = useState<Set<string>>(new Set());
    const [expandedWord, setExpandedWord] = useState<string | null>(null);
    const [lookupData, setLookupData] = useState<Record<string, string[]>>({});
    const [lookupLoading, setLookupLoading] = useState(false);
    const uniqueWords = Object.keys(wordCounts).length;

    useEffect(() => {
        async function loadDictionary() {
            try {
                const response = await fetch(`${import.meta.env.BASE_URL}dictionary.json`);
                if (!response.ok) throw new Error("Failed to load dictionary");
                const data = await response.json();
                setDictionary(new Set(data.dictionary));
            } catch (err) {
                console.error("Failed to load dictionary:", err);
            }
        }
        loadDictionary();
    }, []);

    async function handleLookup(word: string) {
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
                            "Accept": "text/plain",
                            "User-Agent": "Mozilla/5.0"
                        }
                    }
                );
                const text = await response.text();
                const definitions = text.split("/").map(def => def.trim()).filter(Boolean);
                setLookupData(prev => ({ ...prev, [word]: definitions }));
            } catch (err) {
                console.error("Lookup failed:", err);
                setLookupData(prev => ({ ...prev, [word]: [] }));
            } finally {
                setLookupLoading(false);
            }
        }
    }

    async function extractText() {
        if (!selectedFile || dictionary.size === 0) return;
        setLoading(true);

        try {
            const pdfToText = (await import("react-pdftotext")).default;
            let text = await pdfToText(selectedFile);
            text = text.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ");
            let words = text.split(/\s+/).filter(Boolean);

            words = words.filter(
                word =>
                    !stopwords.includes(word) &&
                    dictionary.has(word) &&
                    !/^\d+$/.test(word) &&
                    word.length > 3
            );

            const wordCount = new Map<string, number>();
            words.forEach(word => {
                wordCount.set(word, (wordCount.get(word) || 0) + 1);
            });

            setWordCounts(Object.fromEntries(wordCount));
        } catch (error) {
            console.error("Text extraction failed", error);
            setWordCounts({});
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="upload-container">
            <h2>Analyze PDF</h2>
            <p>Upload a PDF file to extract and count words.</p>

            <div
                className="drop-zone"
                onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.length) setSelectedFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
                onClick={() => document.getElementById("fileInput")?.click()}
            >
                <input
                    id="fileInput"
                    type="file"
                    accept="application/pdf"
                    onChange={e => { if (e.target.files?.length) setSelectedFile(e.target.files[0]); }}
                    style={{ display: "none" }}
                />
                <button className="upload-btn">
                    {selectedFile ? "Change PDF File" : "Select PDF File"}
                </button>
                <p className="small-text">or drag and drop here</p>
            </div>

            <button
                className="process-btn"
                onClick={extractText}
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
                                                    borderRadius: "3px"
                                                }}
                                                onClick={() => handleLookup(word)}
                                            >
                                                {expandedWord === word ? "Close" : "Lookup"}
                                            </button>
                                            <span>{word}</span>
                                        </td>
                                        <td style={{ padding: "8px", textAlign: "right" }}>{count}</td>
                                    </tr>
                                    {expandedWord === word && (
                                        <tr key={`${word}-expanded`}>
                                            <td colSpan={2} style={{ padding: "8px", background: "#eef" }}>
                                                {lookupLoading && "Loading..."}
                                                {!lookupLoading && lookupData[word] && lookupData[word].length > 0 && (
                                                    <div>
                                                        <strong>{word}</strong>
                                                        <ul>
                                                            {lookupData[word].map((def: string, i: number) => (
                                                                <li key={i}>{def}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {!lookupLoading && lookupData[word] && lookupData[word].length === 0 && "No results found."}
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
