import { useDictionaryStore } from "../stores/useDictionaryStore";

export default function TextInput() {
    const pastedText = useDictionaryStore((state) => state.pastedText);
    const setPastedText = useDictionaryStore((state) => state.setPastedText);

    return (
        <div className="text-input-container">
            <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste text here to analyze..."
                style={{
                    width: "100%",
                    minHeight: "150px",
                    padding: "10px",
                    fontSize: "1rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px"
                }}
            />
        </div>
    );
}
