let isTyping = false;

window.addEventListener('load', function () {
    console.log("JavaScript loaded successfully");

    const input = document.getElementById('question');
    const sendButton = document.getElementById('sendButton');

    // Enviar mensaje con Enter
    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Evita salto de línea
            sendMessage();
        }
    });

    // Enviar mensaje con clic en el botón
    sendButton.addEventListener("click", sendMessage);

    // Auto-resize del input
    input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    input.focus();
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function sendMessage() {
    if (isTyping) return;
    isTyping = true;

    const input = document.getElementById("question");
    const text = input.value.trim();
    if (!text) {
        isTyping = false;
        return;
    }

    const messages = document.getElementById("messages");
    const sendButton = document.getElementById("sendButton");
    const typingIndicator = document.getElementById("typingIndicator");

    // Añadir mensaje del usuario
    const userMessage = document.createElement("div");
    userMessage.className = "message user";
    userMessage.innerHTML = `
        <div class="message-content">${escapeHtml(text)}</div>
        <div class="message-avatar">🧑‍💻</div>
    `;
    messages.appendChild(userMessage);

    // Mostrar indicador de escritura
    typingIndicator.style.display = 'block';
    messages.scrollTop = messages.scrollHeight;

    // Deshabilitar input
    input.disabled = true;
    sendButton.disabled = true;

    // Crear mensaje del bot
    const botMessage = document.createElement("div");
    botMessage.className = "message bot";
    botMessage.innerHTML = `
        <div class="message-avatar">👽</div>
        <div class="message-content"></div>
    `;
    const botContent = botMessage.querySelector('.message-content');

    try {
        const response = await fetch("/chat-stream/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: text })
        });

        // Ocultar indicador de escritura y mostrar mensaje del bot
        typingIndicator.style.display = 'none';
        messages.appendChild(botMessage);

        if (!response.ok) {
            const error = await response.json();
            botContent.textContent = `❌ Error: ${error.detail}`;
            botContent.classList.add('error-message');
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulatedText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            accumulatedText += chunk;
            botContent.textContent = accumulatedText;

            // Auto-scroll
            messages.scrollTop = messages.scrollHeight;
        }

    } catch (err) {
        typingIndicator.style.display = 'none';
        if (!messages.contains(botMessage)) {
            messages.appendChild(botMessage);
        }
        botContent.textContent = "❌ Error al conectar con el servidor.";
        botContent.classList.add('error-message');
    } finally {
        // Rehabilitar input
        input.disabled = false;
        sendButton.disabled = false;
        isTyping = false;
        input.value = "";
        input.focus();

        // Scroll final
        messages.scrollTop = messages.scrollHeight;
    }
}
