import { useState } from "react";
import stopwordsJson from "../lib/stopwords.json";
const stopwords: string[] = stopwordsJson.stopwords;

export default function MyComponent() {
    // Variables
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [dictLoaded, setDictLoaded] = useState(false);
    const [dictionary, setDictionary] = useState<string[]>([]);
    const uniqueWords = Object.keys(wordCounts).length;

    function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (files && files.length > 0) setSelectedFile(files[0]);
    }

    function handleDrop(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files && files.length > 0) setSelectedFile(files[0]);
    }

    function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
    }

    async function loadDictionary() {
        if (dictLoaded) return; // don’t reload if already loaded
        const response = await fetch(`${import.meta.env.BASE_URL}dictionary.json`);
        if (!response.ok) throw new Error("Failed to load dictionary");
        const data = await response.json();
        setDictionary(data.dictionary);
        setDictLoaded(true);
    }

    async function extractText() {
        if (!selectedFile) return;
        setLoading(true);

        try {
            // Lazy-load library and dictionary
            const pdfToText = (await import("react-pdftotext")).default;
            if (!dictLoaded) await loadDictionary();

            let text = await pdfToText(selectedFile);
            text = text.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ");
            let words = text.split(/\s+/).filter(Boolean);

            words = words.filter(
                word =>
                    !stopwords.includes(word) &&
                    dictionary.includes(word) &&
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
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById("fileInput")?.click()}
            >
                <input
                    id="fileInput"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
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
                disabled={!selectedFile || loading}
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
                    Object.entries(wordCounts).map(([word, count]) => (
                        <p key={word}>{word}, {count}</p>
                    ))
                )}
            </div>
        </div>
    );
}
