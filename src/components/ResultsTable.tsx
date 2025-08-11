import { useDictionaryStore } from "../stores/useDictionaryStore";
import WordTableBody from "./WordTableBody";

export default function ResultsTable() {
    const wordCounts = useDictionaryStore((state) => state.wordCounts);
    const loading = useDictionaryStore((state) => state.loading);

    const uniqueWords = Object.keys(wordCounts).length;
    if (!uniqueWords) {
        return <EmptyResultContent />
    }
    return (
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
                    <WordTableBody />
                </table>
            )}
        </div>
    );
}

export function EmptyResultContent() {
    return (
        <section className="result-details">
            <div>
                <div className="result-details__start-view empty-heading">
                    Upload a PDF or paste some text to get all the words.
                </div>
            </div>
        </section>
    );
}