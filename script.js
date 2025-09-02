document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENTOS DEL DOM (sin cambios) ---
    const ideaInput = document.getElementById('ideaInput');
    const generateButton = document.getElementById('generateButton');
    const recordButton = document.getElementById('recordButton');
    const clearButton = document.getElementById('clearButton');
    const statusMessage = document.getElementById('statusMessage');
    const jsonOutput = document.getElementById('jsonOutput');
    const copyButton = document.getElementById('copyButton');
    const loader = document.getElementById('loader');

    // --- CONFIGURACIÓN (sin cambios) ---
    const API_KEY = "AIzaSyA6_c49A8N8EG0Uv5aXTqY3B_47xqwMhLY"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    // ====================================================================
    // === LÓGICA DE VOZ INSPIRADA EN "EL ELEMENTO" (A PRUEBA DE ERRORES) ===
    // ====================================================================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isRecording = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = false; // Importante: Solo nos interesan los resultados finales para evitar duplicados.

        recognition.onstart = () => {
            isRecording = true;
            recordButton.textContent = "🛑 Detener Grabación";
            recordButton.classList.add('recording');
            statusMessage.textContent = "Habla ahora, te estoy escuchando...";
            statusMessage.classList.remove('hidden');
        };

        recognition.onresult = (event) => {
            let newTranscript = '';
            // Recorremos solo los nuevos resultados desde la última vez que se llamó al evento
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    newTranscript += event.results[i][0].transcript;
                }
            }

            if (newTranscript) {
                // Si el cuadro de texto ya tiene algo, añadimos un espacio antes del nuevo texto.
                if (ideaInput.value.trim().length > 0) {
                    ideaInput.value += ' ';
                }
                ideaInput.value += newTranscript.trim();
                saveIdeaToMemory();
            }
        };

        recognition.onerror = (event) => {
            console.error("Error en el reconocimiento de voz:", event.error);
            let msg = 'Error en reconocimiento de voz.';
            if (event.error === 'no-speech') msg = 'No se detectó voz. Intenta de nuevo.';
            else if (event.error === 'audio-capture') msg = 'No se pudo acceder al micrófono.';
            else if (event.error === 'not-allowed') msg = 'Permiso de micrófono denegado.';
            statusMessage.textContent = msg;
            statusMessage.classList.remove('hidden');
            // Detener la UI si hay un error
            isRecording = false; 
            recognition.stop();
        };

        recognition.onend = () => {
            isRecording = false;
            recordButton.textContent = "🎤 Grabar Idea";
            recordButton.classList.remove('recording');
            statusMessage.classList.add('hidden');
        };
    } else {
        recordButton.disabled = true;
        recordButton.textContent = "Voz no Soportada";
    }

    // --- El resto del archivo no cambia ---
    recordButton.addEventListener('click', handleRecordClick);
    clearButton.addEventListener('click', handleClearClick);
    generateButton.addEventListener('click', handleGenerateClick);
    copyButton.addEventListener('click', handleCopyClick);
    ideaInput.addEventListener('input', saveIdeaToMemory);

    function saveIdeaToMemory() { localStorage.setItem('userIdeaText', ideaInput.value); }
    function loadIdeaFromMemory() { const savedIdea = localStorage.getItem('userIdeaText'); if (savedIdea) { ideaInput.value = savedIdea; } }

    function handleRecordClick() { if (isRecording) { recognition.stop(); } else { recognition.start(); } }
    function handleClearClick() { 
        ideaInput.value = ''; 
        jsonOutput.textContent = ''; 
        copyButton.classList.add('hidden'); 
        localStorage.removeItem('userIdeaText'); 
    }

    async function handleGenerateClick() {
        // ... El prompt maestro y la lógica de fetch no cambian ...
        const userIdea = ideaInput.value;
        if (!userIdea.trim()) { alert("Por favor, introduce una idea para el video."); return; }
        loader.classList.remove('hidden');
        jsonOutput.textContent = '';
        copyButton.classList.add('hidden');
        try {
            const masterPrompt = `
Actúa como un experto en creación de prompts para IA de generación de video como Google VEO. Tu tarea es analizar la idea de video del usuario y generar un prompt JSON detallado.
---
**REGLA MÁS IMPORTANTE:** La idea del usuario es la directiva creativa principal. El estilo, los elementos y la descripción deben basarse **PRIORITARIAMENTE** en lo que el usuario pida (ej: 'realista', 'cinematográfico', 'blanco y negro', etc.). El siguiente ejemplo es solo una guía para el formato, la estructura y el nivel de detalle, NO para el estilo artístico.
---
**EJEMPLO DE FORMATO Y CALIDAD:**
**Idea de video (ejemplo):** "Un trailer épico de un documental sobre ballenas jorobadas en el océano."
**JSON Generado (ejemplo):**
{
  "descripcion": "An epic, cinematic trailer for a documentary about humpback whales. The video opens with a majestic shot of a whale breaching in slow motion against a sunset. Quick cuts show whales migrating, bubble-net feeding, and a calf swimming with its mother. The overall tone is awe-inspiring and respectful of nature.",
  "estiloVisual": "Cinematic documentary, high-contrast, deep blue and orange tones, shot on RED camera, shallow depth of field, anamorphic lens flares.",
  "movimientoCamara": "Slow, sweeping aerial drone shots; smooth underwater tracking shots following the whales; dramatic slow-motion for key actions like breaches.",
  "iluminacion": "Natural, dramatic lighting. Golden hour sunlight filtering through the water surface. Dark, deep ocean abyss contrasted with bright sunlit surfaces.",
  "entornoGeneral": "The vast, open ocean. Tropical blue waters, arctic icy seas, and deep abyssal zones.",
  "elementos": "Humpback whales (adults and calves), vast ocean, sun, plankton, arctic icebergs, coral reefs.",
  "dinamicaEscena": "Starts calm and majestic, builds intensity with faster cuts and powerful music, ends on an emotional and awe-inspiring note.",
  "planoFinal": "A close-up shot of a whale's eye, which slowly closes.",
  "instruccionTextoPantalla": "OCEAN GIANTS - Coming Soon",
  "refuerzosSemanticos": ["majesty", "nature", "epic", "life", "ocean", "documentary", "connection"],
  "musicaDeFondo": "Epic orchestral score, builds from a slow piano intro to a powerful crescendo with strings and choir. Similar to Hans Zimmer.",
  "efectosDeSonido": "Amplified whale songs and calls, the powerful splash of a breach, bubbling water, the cracking of ice.",
  "ambienteSonoro": "Immersive, vast, and deep. A mix of powerful natural sounds and an emotional musical score.",
  "vozEnOff_Texto": "In a world beneath the waves, giants still roam. They sing the songs of the deep, a legacy as old as time itself. Witness their incredible journey.",
  "vozEnOff_Estilo": "Deep, resonant male voice. Calm, awe-inspired, documentary style. Similar to David Attenborough.",
  "vozEnOff_Texto_es": "En un mundo bajo las olas, los gigantes aún deambulan. Cantan las canciones de las profundidades, un legado tan antiguo como el tiempo. Sé testigo de su increíble viaje.",
  "vozEnOff_Estilo_es": "Voz masculina, grave y resonante. Tono calmado, de asombro, estilo documental. Español latino neutro."
}
---
**AHORA, BASÁNDOTE PRINCIPALMENTE EN LA IDEA DEL USUARIO, genera un nuevo JSON con la misma estructura y calidad del ejemplo.**
**Idea de video (del usuario):** ${userIdea}
Tu respuesta debe ser solo el código JSON, sin explicaciones, texto adicional ni la envoltura de markdown \`\`\`json. Todos los valores deben estar en inglés, excepto los que terminan en '_es'.
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
    loadIdeaFromMemory();
});