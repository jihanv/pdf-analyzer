import { useDictionaryStore } from "../stores/useDictionaryStore";
import stopwordsJson from "../lib/stopwords.json";

export default function ProcessButton() {
    const selectedFile = useDictionaryStore((state) => state.selectedFile);
    const pastedText = useDictionaryStore((state) => state.pastedText);
    const loading = useDictionaryStore((state) => state.loading);
    const dictionary = useDictionaryStore((state) => state.dictionary);
    const extractText = useDictionaryStore((state) => state.extractText);

    const handleProcess = async () => {
        if (!selectedFile && !pastedText.trim()) return;
        const stopwords = stopwordsJson.stopwords;
        await extractText(selectedFile || pastedText, stopwords);
    };

    return (
        <button
            className="process-btn"
            onClick={handleProcess}
            disabled={(!selectedFile && !pastedText.trim()) || loading || dictionary.size === 0}
        >
            {loading
                ? "Processing..."
                : selectedFile
                    ? <>Process <strong>{selectedFile.name}</strong></>
                    : "Process Text"}
        </button>
    );
}
