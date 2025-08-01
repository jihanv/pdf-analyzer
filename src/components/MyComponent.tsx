import pdfToText from 'react-pdftotext'

function extractText(event) {
    const file = event.target.files[0];
    pdfToText(file)
        .then(text => console.log(text))
        .catch(error => console.error("Text extraction failed", error));
}

export default function MyComponent() {
    return (
        <div className="app">
            <header className="App-header">
                <input type="file" accept="application/pdf" onChange={extractText} />
            </header>
        </div>
    );
}
