import { useDictionaryStore } from "../stores/useDictionaryStore";

export default function FileUpload() {
    const selectedFile = useDictionaryStore((state) => state.selectedFile);
    const setSelectedFile = useDictionaryStore((state) => state.setSelectedFile);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("fileInput")?.click()}
        >
            <input
                id="fileInput"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                style={{ display: "none" }}
            />
            <button className="upload-btn">
                {selectedFile ? `Change File` : "Select File"}
            </button>
            <p className="small-text">or drag and drop here</p>
        </div>
    );
}
