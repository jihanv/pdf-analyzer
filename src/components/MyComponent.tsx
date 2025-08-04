import { useEffect } from "react";

import { useDictionaryStore } from "../stores/useDictionaryStore";
import Header from "./Header";
import FileUpload from "./FileUpload";
import ProcessButton from "./ProcessButton";
import ResultsTable from "./ResultsTable";
import TextInput from "./TextInput";

export default function MyComponent() {


    const setDictionary = useDictionaryStore((state) => state.setDictionary);



    // Load dictionary on mount
    useEffect(() => {
        async function loadDictionary() {
            try {
                const response = await fetch(`${import.meta.env.BASE_URL}dictionary.json`);
                if (!response.ok) throw new Error("Failed to load dictionary");
                const data = await response.json();
                setDictionary(data.dictionary);
            } catch (err) {
                console.error("Failed to load dictionary:", err);
            }
        }
        loadDictionary();
    }, [setDictionary]);


    return (
        <div className="upload-container">
            <Header />
            <FileUpload />
            <TextInput />
            <ProcessButton />
            <ResultsTable />
        </div>
    );
}
