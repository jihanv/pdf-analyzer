import { useEffect } from "react";

import { useDictionaryStore } from "../stores/useDictionaryStore";
import Header from "./Header";
import FileUpload from "./FileUpload";
import ProcessButton from "./ProcessButton";
import ResultsTable from "./ResultsTable";
import TextInput from "./TextInput";
import InputModeToggle from "./InputModeToggle";

export default function MyComponent() {


    const setDictionary = useDictionaryStore((state) => state.setDictionary);
    const inputMode = useDictionaryStore((state) => state.inputMode);



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
            <InputModeToggle />
            <div className="view">

                <div className="input-container">
                    {inputMode === "pdf" && <FileUpload />}
                    {inputMode === "text" && <TextInput />}
                    <div className="apple"></div>
                </div>
                <ResultsTable />

            </div>
            <ProcessButton />
        </div>
    );
}
