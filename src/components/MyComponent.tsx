import { useState } from "react";
import pdfToText from "react-pdftotext";
import { stopwords } from "../lib/stopwords.json"; // <-- adjust path as needed

export default function MyComponent() {
    const [wordCounts, setWordCounts] = useState<Record<string, number>>({});

    async function extractText(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        try {
            let text = await pdfToText(file);

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
                <input type="file" accept="application/pdf" onChange={extractText} />
            </header>
            <div className="pdf-content" style={{ marginTop: "20px", maxHeight: "400px", overflowY: "auto" }}>
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
