import { useDictionaryStore } from "../stores/useDictionaryStore";

export default function InputModeToggle() {
    const inputMode = useDictionaryStore((state) => state.inputMode);
    const setInputMode = useDictionaryStore((state) => state.setInputMode);

    return (
        <div style={{ marginBottom: "1rem" }}>
            <label>
                <input
                    type="radio"
                    name="inputMode"
                    value="text"
                    checked={inputMode === "text"}
                    onChange={() => setInputMode("text")}
                />
                Paste Text
            </label>
            <label style={{ marginRight: "1rem" }}>
                <input
                    type="radio"
                    name="inputMode"
                    value="pdf"
                    checked={inputMode === "pdf"}
                    onChange={() => setInputMode("pdf")}
                />
                Upload PDF
            </label>

        </div>
    );
}
