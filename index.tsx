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

// --- PRACTICE COMPONENT ---
const Practice = () => {
    const [mode, setMode] = useState('text');
    return (
        <div>
             <h2><Icon name="model_training" /> Practice Arena</h2>
            <div className="sub-tabs">
                <button className={`sub-tab-button ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>Text Correction</button>
                <button className={`sub-tab-button ${mode === 'voice' ? 'active' : ''}`} onClick={() => setMode('voice')}>Pronunciation Practice</button>
            </div>
            {mode === 'text' && <TextCorrection />}
            {mode === 'voice' && <PronunciationPractice />}
        </div>
    );
};

const TextCorrection = () => {
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [corrections, setCorrections] = useState(null);

    const handleCheck = async () => {
        if (!text.trim() || !ai) return;
        setLoading(true);
        setError('');
        setCorrections(null);
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `You are a language tutor. Analyze the following text and provide grammar and spelling corrections. For each correction, explain the error simply. Text: "${text}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            corrections: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        original: { type: Type.STRING },
                                        corrected: { type: Type.STRING },
                                        explanation: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            const data = JSON.parse(response.text);
            setCorrections(data.corrections);
        } catch (err) {
            console.error(err);
            setError("Could not process the text. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write some text in Spanish or English to get it corrected..."
                aria-label="Text for correction"
            />
            <button className="btn" style={{marginTop: '1rem', width: '100%'}} onClick={handleCheck} disabled={loading}>
                 <Icon name="spellcheck"/> {loading ? 'Analyzing...' : 'Check Text'}
            </button>
            {loading && <Loader />}
            {error && <ErrorMessage message={error} />}
            {corrections && (
                <div className="result-card correction-result">
                    <h3>Corrections</h3>
                    {corrections.length > 0 ? (
                        <ul>
                            {corrections.map((c, i) => (
                                <li key={i}>
                                    <p><strong>Original:</strong> <del>{c.original}</del></p>
                                    <p><strong>Correction:</strong> <ins style={{textDecoration: 'none', color: 'var(--success-color)'}}>{c.corrected}</ins></p>
                                    <p><strong>Explanation:</strong> {c.explanation}</p>
                                </li>
                            ))}
                        </ul>
                    ) : <p>Looks good! No corrections found.</p>}
                </div>
            )}
        </div>
    );
};


const PronunciationPractice = () => {
    const PHRASE = "The quick brown fox jumps over the lazy dog.";
    const [isRecording, setIsRecording] = useState(false);
    const [transcribedText, setTranscribedText] = useState('');
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        // FIX: Cast window to `any` to access non-standard SpeechRecognition APIs which are not part of the default Window type.
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recog = new SpeechRecognition();
            recog.continuous = false;
            recog.interimResults = false;
            recog.lang = 'en-US';
            recog.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setTranscribedText(transcript);
                getFeedback(transcript);
            };
            recog.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
            };
            recog.onend = () => {
                setIsRecording(false);
            };
            setRecognition(recog);
        }
    }, []);

    const toggleRecording = () => {
        if (!recognition) return;
        if (isRecording) {
            recognition.stop();
        } else {
            setTranscribedText('');
            setFeedback('');
            recognition.start();
        }
        setIsRecording(!isRecording);
    };

    const getFeedback = async (transcript) => {
        if (!transcript || !ai) return;
        setLoading(true);
        setFeedback('');
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `A user is practicing their English pronunciation.
                The target phrase is: "${PHRASE}"
                The user said: "${transcript}"
                Provide brief, constructive feedback on their pronunciation, pointing out one or two key areas for improvement. Be encouraging.`
            });
            setFeedback(response.text);
        } catch (err) {
            console.error(err);
            setFeedback("Sorry, couldn't get feedback right now.");
        } finally {
            setLoading(false);
        }
    };
    
    const speakPhrase = () => {
        const utterance = new SpeechSynthesisUtterance(PHRASE);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    if (!recognition) {
        return <ErrorMessage message="Speech recognition is not supported by your browser." />;
    }

    return (
        <div style={{textAlign: 'center'}}>
            <p>Practice saying this phrase:</p>
            <h3 style={{margin: '1rem 0'}}>
                {PHRASE}
                <button onClick={speakPhrase} className="pronounce-btn" aria-label="Listen to phrase"><Icon name="volume_up"/></button>
            </h3>
            <button className="btn" onClick={toggleRecording}>
                <Icon name={isRecording ? 'stop_circle' : 'mic'}/> {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            {transcribedText && <p className="transcribed-text">You said: "{transcribedText}"</p>}
            {loading && <Loader />}
            {feedback && <div className="result-card"><p>{feedback}</p></div>}
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
                <button className={`tab-button ${activeTab === 'practice' ? 'active' : ''}`} onClick={() => setActiveTab('practice')}>
                   <Icon name="model_training" /> Practice
                </button>
                <button className={`tab-button ${activeTab === 'vocabulary' ? 'active' : ''}`} onClick={() => setActiveTab('vocabulary')}>
                   <Icon name="category" /> Vocabulary
                </button>
            </nav>

            <main className="tab-content">
                {activeTab === 'dictionary' && <Dictionary />}
                {activeTab === 'practice' && <Practice />}
                {activeTab === 'vocabulary' && <Vocabulary />}
            </main>
        </div>
    );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
