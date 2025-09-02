document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM ---
    const ideaInput = document.getElementById('ideaInput');
    const generateButton = document.getElementById('generateButton');
    const recordButton = document.getElementById('recordButton');
    const clearButton = document.getElementById('clearButton');
    const statusMessage = document.getElementById('statusMessage');
    const jsonOutput = document.getElementById('jsonOutput');
    const copyButton = document.getElementById('copyButton');
    const loader = document.getElementById('loader');

    // --- CONFIGURACIÓN ---
    const API_KEY = "AIzaSyA6_c49A8N8EG0Uv5aXTqY3B_47xqwMhLY"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    // --- LÓGICA DE VOZ (VERSIÓN FINAL Y ROBUSTA) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isRecording = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            let newTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    newTranscript += event.results[i][0].transcript;
                }
            }
            if (newTranscript) {
                if (ideaInput.value.trim().length > 0) { ideaInput.value += ' '; }
                ideaInput.value += newTranscript.trim();
                saveIdeaToMemory();
            }
        };

        recognition.onerror = (event) => {
            console.error("Error en el reconocimiento de voz:", event.error);
            isRecording = false;
            updateRecordButtonUI();
        };

        recognition.onend = () => {
            if (isRecording) {
                recognition.start();
            }
        };

    } else {
        recordButton.disabled = true;
        recordButton.textContent = "Voz no Soportada";
    }
    
    function toggleRecording() {
        if (!recognition) return;
        isRecording = !isRecording;
        if (isRecording) {
            recognition.start();
        } else {
            recognition.stop();
        }
        updateRecordButtonUI();
    }
    
    function updateRecordButtonUI() {
        if (isRecording) {
            recordButton.textContent = "🛑 Detener Grabación";
            recordButton.classList.add('recording');
            statusMessage.textContent = "Habla ahora, te estoy escuchando...";
            statusMessage.classList.remove('hidden');
        } else {
            recordButton.textContent = "🎤 Grabar Idea";
            recordButton.classList.remove('recording');
            statusMessage.classList.add('hidden');
        }
    }

    // --- EVENT LISTENERS ---
    recordButton.addEventListener('click', toggleRecording);
    clearButton.addEventListener('click', handleClearClick);
    generateButton.addEventListener('click', handleGenerateClick);
    copyButton.addEventListener('click', handleCopyClick);
    ideaInput.addEventListener('input', saveIdeaToMemory);

    // --- LÓGICA DE MEMORIA ---
    function saveIdeaToMemory() { localStorage.setItem('userIdeaText', ideaInput.value); }
    function loadIdeaFromMemory() { const savedIdea = localStorage.getItem('userIdeaText'); if (savedIdea) { ideaInput.value = savedIdea; } }

    // --- FUNCIONES DE LOS BOTONES ---
    function handleClearClick() { 
        if(isRecording) { recognition.stop(); isRecording = false; updateRecordButtonUI(); }
        ideaInput.value = ''; 
        jsonOutput.textContent = ''; 
        copyButton.classList.add('hidden'); 
        localStorage.removeItem('userIdeaText'); 
    }

    // --- FUNCIÓN PRINCIPAL DE GENERACIÓN (CON PROMPT MAESTRO v7.0) ---
    async function handleGenerateClick() {
        const userIdea = ideaInput.value;
        if (!userIdea.trim()) { alert("Por favor, introduce una idea para el video."); return; }
        loader.classList.remove('hidden');
        jsonOutput.textContent = '';
        copyButton.classList.add('hidden');
        try {
            // --- PROMPT MAESTRO v7.0 - ESTRUCTURA PROFESIONAL FINAL ---
            const masterPrompt = `
Actúa como un experto en creación de prompts para IA de generación de video (como Google VEO, Runway, Pika). Tu tarea es analizar la idea del usuario y generar un prompt JSON detallado y profesional, siguiendo la estructura y calidad del ejemplo.
IMPORTANTE: Todos los valores dentro del JSON deben estar en inglés.

---
**REGLA MÁS IMPORTANTE:** La idea del usuario es la directiva creativa principal. El estilo, los elementos y la descripción deben basarse **PRIORITARIAMENTE** en lo que el usuario pida. El ejemplo es una guía de **formato y calidad**, NO de estilo artístico. La clave es definir una ÚNICA acción principal clara.
---

**EJEMPLO DE FORMATO PROFESIONAL:**
**Idea de video (ejemplo):** "Un anuncio cinemático de un reloj de lujo que se ensambla solo en el aire."
**JSON Generado (ejemplo):**
{
  "description": "Cinematic slow-motion reveal of a luxury watch assembling itself in midair. Each component floats into frame with precision: a golden case, intricate gears, the sapphire crystal, and the watch hands, all connecting perfectly. The background is a dark, elegant studio with golden, out-of-focus particles.",
  "style": "Cinematic, hyperrealistic, luxury product commercial, sophisticated, elegant.",
  "camera": "Dynamic close-up shots, smooth 360-degree rotation around the watch, dramatic focus pulls between components.",
  "lighting": "High-contrast studio lighting, strong key light creating golden reflections, soft rim lighting to define edges, dark background.",
  "environment": "Minimalist dark studio void with subtle, glowing golden particles and soft light beams.",
  "elements": ["Luxury watch components", "golden gears", "sapphire crystal", "watch hands", "elegant watch case", "glowing particles"],
  "motion": "Components float gracefully and snap into place with satisfying precision. The final assembly is seamless.",
  "ending": "A hero shot of the fully assembled, perfect watch, with the second hand starting to tick.",
  "keywords": ["luxury watch", "product assembly", "cinematic commercial", "slow-motion reveal", "hyperrealistic"]
}
---

**AHORA, BASÁNDOTE PRINCIPALMENTE EN LA IDEA DEL USUARIO, genera un nuevo JSON con esta estructura profesional.**

**Idea de video (del usuario):** ${userIdea}

Tu respuesta debe ser solo el código JSON, sin explicaciones ni texto adicional. Los campos del JSON deben ser: "description", "style", "camera", "lighting", "environment", "elements", "motion", "ending", "keywords".
            `;
            
            const requestBody = { contents: [{ parts: [{ text: masterPrompt }] }] };
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
            if (!response.ok) { const errorData = await response.json(); console.error("Error detallado de la API:", errorData); throw new Error(`Error en la API: ${response.statusText}`); }
            const data = await response.json();
            const jsonResult = data.candidates[0].content.parts[0].text;
            jsonOutput.textContent = jsonResult;
            copyButton.classList.remove('hidden');
        } catch (error) { console.error("Error al generar el prompt:", error); jsonOutput.textContent = "Hubo un error al contactar la API. Por favor, revisa la consola para más detalles."; } finally { loader.classList.add('hidden'); }
    }
    
    function handleCopyClick() { if (jsonOutput.textContent) { navigator.clipboard.writeText(jsonOutput.textContent).then(() => { copyButton.textContent = "¡Copiado!"; setTimeout(() => { copyButton.textContent = "Copiar"; }, 2000); }).catch(err => { console.error('Error al copiar el texto: ', err); alert("No se pudo copiar el texto."); }); } }
    
    // --- INICIALIZACIÓN ---
    loadIdeaFromMemory();
});