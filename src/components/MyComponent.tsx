import { useState } from "react";
import { stopwords } from "../lib/stopwords.json";

export default function MyComponent() {

    // Variables
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
    const uniqueWords = Object.keys(wordCounts).length;

    function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    }

    function handleDrop(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
        }
    }

    function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
    }

    async function extractText() {
        if (!selectedFile) return;

        try {
            // Lazy load library

            const pdfToText = (await import("react-pdftotext")).default;

            let text = await pdfToText(selectedFile);
            text = text.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ");
            let words = text.split(/\s+/).filter(Boolean);
            words = words.filter(
                word => !stopwords.includes(word) && !/^\d+$/.test(word) && word.length > 3
            );

            const wordCount: Record<string, number> = {};
            words.forEach(word => {
                wordCount[word] = (wordCount[word] || 0) + 1;
            });

            setWordCounts(wordCount);
        } catch (error) {
            console.error("Text extraction failed", error);
            setWordCounts({});
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
                disabled={!selectedFile}
            >
                {selectedFile ? (
                    <>Process <strong>{selectedFile.name}</strong></>
                ) : (
                    "Process PDF"
                )}
            </button>

            <div className="results">
                {uniqueWords > 0 && (
                    <p><strong>Unique words:</strong> {uniqueWords}</p>
                )}
                {uniqueWords === 0 ? (
                    "No data yet."
                ) : (
                    Object.entries(wordCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([word, count]) => (
                            <p key={word}>
                                {word}, {count}
                            </p>
                        ))
                )}
            </div>
        </div>
    );
}
