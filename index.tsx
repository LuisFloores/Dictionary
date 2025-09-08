import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

// --- DUMMY DATA FOR VOCABULARY ---
const vocabularyData = {
    Greetings: [
        { spanish: "Hola", english: "Hello" },
        { spanish: "¿Cómo estás?", english: "How are you?" },
        { spanish: "Buenos días", english: "Good morning" },
        { spanish: "Gracias", english: "Thank you" },
    ],
    Travel: [
        { spanish: "¿Dónde está la estación de tren?", english: "Where is the train station?" },
        { spanish: "Quisiera un boleto para...", english: "I would like a ticket to..." },
        { spanish: "El aeropuerto", english: "The airport" },
        { spanish: "La cuenta, por favor", english: "The check, please" },
    ],
    Food: [
        { spanish: "Agua", english: "Water" },
        { spanish: "Pollo", english: "Chicken" },
        { spanish: "Me gustaría pedir...", english: "I would like to order..." },
        { spanish: "Delicioso", english: "Delicious" },
    ],
    Animals: [
        { spanish: "Perro", english: "Dog" },
        { spanish: "Gato", english: "Cat" },
        { spanish: "Pájaro", english: "Bird" },
        { spanish: "Pez", english: "Fish" },
    ],
    "School Supplies": [
        { spanish: "Lápiz", english: "Pencil" },
        { spanish: "Libro", english: "Book" },
        { spanish: "Mochila", english: "Backpack" },
        { spanish: "Tijeras", english: "Scissors" },
    ],
    Fruits: [
        { spanish: "Manzana", english: "Apple" },
        { spanish: "Plátano", english: "Banana" },
        { spanish: "Naranja", english: "Orange" },
        { spanish: "Fresa", english: "Strawberry" },
    ],
};

type VocabCategory = keyof typeof vocabularyData;

// --- API HELPER ---
let ai;
try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
}

// --- UTILITY COMPONENTS ---
const Loader = () => <div className="loader"></div>;
const ErrorMessage = ({ message }) => <div className="error-message">{message}</div>;
const Icon = ({ name }) => <span className="material-symbols-outlined">{name}</span>;

// --- DICTIONARY COMPONENT ---
const Dictionary = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const handleSearch = async () => {
        if (!query.trim() || !ai) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Provide a dictionary entry for the word/phrase "${query}". Detect if it's Spanish or English. Give the main translation, a short definition in the translated language, and a simple example sentence.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            original_word: { type: Type.STRING },
                            translation: { type: Type.STRING },
                            definition: { type: Type.STRING },
                            example: { type: Type.STRING },
                            translated_lang_code: { type: Type.STRING, description: 'ISO 639-1 code (e.g., "en" or "es")' }
                        }
                    }
                }
            });
            const data = JSON.parse(response.text);
            setResult(data);
        } catch (err) {
            console.error(err);
            setError("Sorry, I couldn't find that. Please try another word.");
        } finally {
            setLoading(false);
        }
    };
    
    const speak = (text, lang) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div>
            <h2><Icon name="book" /> Bidirectional Dictionary</h2>
            <div className="input-group">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a word in Spanish or English..."
                    aria-label="Search dictionary"
                />
                <button className="btn" onClick={handleSearch} disabled={loading}>
                    <Icon name="search"/> {loading ? 'Searching...' : 'Search'}
                </button>
            </div>
            {loading && <Loader />}
            {error && <ErrorMessage message={error} />}
            {result && (
                <div className="result-card">
                    <h3>
                        {result.original_word}
                        <button 
                            className="pronounce-btn" 
                            onClick={() => speak(result.translation, result.translated_lang_code)}
                            aria-label="Pronounce translation"
                        >
                            <Icon name="volume_up"/>
                        </button>
                    </h3>
                    <p><strong>Translation:</strong> {result.translation}</p>
                    <p><strong>Definition:</strong> {result.definition}</p>
                    <p><strong>Example:</strong> <em>{result.example}</em></p>
                </div>
            )}
        </div>
    );
};

// --- VOCABULARY COMPONENT ---
const Vocabulary = () => {
    const [category, setCategory] = useState<VocabCategory>('Greetings');

    const speak = (text, lang) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    };
    
    return (
        <div>
            <h2><Icon name="category" /> Thematic Vocabulary</h2>
            <div className="vocab-categories">
                {Object.keys(vocabularyData).map(cat => (
                    <button 
                        key={cat} 
                        className={`btn ${category === cat ? '' : 'btn-outline'}`}
                        onClick={() => setCategory(cat as VocabCategory)}
                        style={{backgroundColor: category === cat ? 'var(--accent-color)' : 'transparent', color: category === cat ? 'white': 'var(--accent-color)', border: '1px solid var(--accent-color)'}}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            <ul className="vocab-list">
                {vocabularyData[category].map((item, index) => (
                    <li key={index} className="vocab-item">
                        <span>{item.spanish}</span>
                        <span>{item.english}</span>
                        <div>
                             <button className="pronounce-btn" onClick={() => speak(item.spanish, 'es-ES')} aria-label="Pronounce in Spanish"><Icon name="volume_up"/></button>
                             <button className="pronounce-btn" onClick={() => speak(item.english, 'en-US')} aria-label="Pronounce in English"><Icon name="volume_up"/></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// --- MAIN APP COMPONENT ---
const App = () => {
    const [activeTab, setActiveTab] = useState('dictionary');

    if (!ai) {
        return (
            <div className="app-container">
                 <header><h1>Spanish-English Learning Hub</h1></header>
                 <ErrorMessage message="Could not initialize the AI model. Please check your API key and refresh the page."/>
            </div>
        )
    }

    return (
        <div className="app-container">
            <header>
                <h1>Spanish-English Learning Hub</h1>
            </header>

            <nav className="tabs">
                <button className={`tab-button ${activeTab === 'dictionary' ? 'active' : ''}`} onClick={() => setActiveTab('dictionary')}>
                   <Icon name="book" /> Dictionary
                </button>
                <button className={`tab-button ${activeTab === 'vocabulary' ? 'active' : ''}`} onClick={() => setActiveTab('vocabulary')}>
                   <Icon name="category" /> Vocabulary
                </button>
            </nav>

            <main className="tab-content">
                {activeTab === 'dictionary' && <Dictionary />}
                {activeTab === 'vocabulary' && <Vocabulary />}
            </main>
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);