import { useDictionaryStore } from "../stores/useDictionaryStore";

export default function TextInput() {
    const pastedText = useDictionaryStore((state) => state.pastedText);
    const setPastedText = useDictionaryStore((state) => state.setPastedText);

    return (
        <textarea
            className="text-input"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Paste text here to analyze..."
        />
    );
}
