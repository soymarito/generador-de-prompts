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
    // === LÓGICA DE RECONOCIMIENTO DE VOZ (VERSIÓN ROBUSTA Y CORREGIDA) ===
    // ====================================================================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isRecording = false;
    let final_transcript = ''; // Variable para guardar el texto confirmado

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onstart = () => {
            isRecording = true;
            final_transcript = ideaInput.value; // Empezar con el texto que ya exista
            recordButton.textContent = "🛑 Detener Grabación";
            recordButton.classList.add('recording');
            statusMessage.textContent = "Habla ahora, te estoy escuchando...";
            statusMessage.classList.remove('hidden');
        };

        recognition.onresult = (event) => {
            let interim_transcript = ''; // Variable para el texto provisional
            // Iterar sobre todos los resultados desde el último punto final
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            // Actualizar el campo de texto con la combinación del texto final y el provisional
            ideaInput.value = final_transcript + interim_transcript;
            saveIdeaToMemory();
        };

        recognition.onerror = (event) => {
            console.error("Error en el reconocimiento de voz:", event.error);
            statusMessage.textContent = `Error: ${event.error}. Inténtalo de nuevo.`;
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

    // --- El resto del archivo (listeners, memoria, generación) no cambia ---
    recordButton.addEventListener('click', handleRecordClick);
    clearButton.addEventListener('click', handleClearClick);
    generateButton.addEventListener('click', handleGenerateClick);
    copyButton.addEventListener('click', handleCopyClick);
    ideaInput.addEventListener('input', saveIdeaToMemory);

    function saveIdeaToMemory() { localStorage.setItem('userIdeaText', ideaInput.value); }
    function loadIdeaFromMemory() { const savedIdea = localStorage.getItem('userIdeaText'); if (savedIdea) { ideaInput.value = savedIdea; } }

    function handleRecordClick() { if (isRecording) { recognition.stop(); } else { recognition.start(); } }
    function handleClearClick() { ideaInput.value = ''; jsonOutput.textContent = ''; copyButton.classList.add('hidden'); localStorage.removeItem('userIdeaText'); }

    async function handleGenerateClick() {
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
});```

### **Los Próximos Pasos**

1.  **Reemplaza** el código de tu `script.js` con esta nueva versión.
2.  **Sube los archivos actualizados a GitHub.**
3.  **Espera un par de minutos** para que GitHub despliegue los cambios.
4.  Abre la URL de tu aplicación en tu celular y **haz una recarga forzada**. (En Chrome para Android, puedes ir al menú de tres puntos y pulsar el icono de recargar).
5.  ¡Prueba a grabar de nuevo!

Estoy convencido de que esta es la solución definitiva para el problema del audio en el celular. ¡Avísame cómo te va