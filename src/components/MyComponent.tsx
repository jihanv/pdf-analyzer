import { useState } from "react";
import pdfToText from "react-pdftotext";
import { stopwords } from "../lib/stopwords.json"; // <-- adjust path as needed

export default function MyComponent() {

    // States
    const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Functions

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
        event.preventDefault(); // Needed so drop works
    }

    async function extractText() {
        if (!selectedFile) return; // No file selected yet

        try {
            let text = await pdfToText(selectedFile);

            text = text.toLocaleLowerCase().replace(/[^a-z0-9\s]/g, " ");
            let words = text.split(/\s+/).filter(Boolean);

            words = words.filter(
                word => !stopwords.includes(word) && !/^\d+$/.test(word) && word.length > 2
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
        <div className="app">
            <header className="App-header">
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    style={{
                        border: "2px dashed #ccc",
                        padding: "20px",
                        textAlign: "center",
                        marginBottom: "10px",
                        cursor: "pointer"
                    }}
                >
                    Drag & Drop PDF here
                </div>
                <input type="file" accept="application/pdf" onChange={handleFileSelect} />
                <button onClick={extractText} disabled={!selectedFile}>
                    Process PDF
                </button>
            </header>
            <div className="pdf-content">
                {Object.keys(wordCounts).length === 0 ? (
                    "No data yet."
                ) : (
                    <div>
                        {Object.entries(wordCounts)
                            .sort((a, b) => b[1] - a[1])
                            .map(([word, count]) => (
                                <p key={word}>
                                    <strong>{word}</strong>, {count}
                                </p>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
