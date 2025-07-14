let isTyping = false;

window.addEventListener('load', function () {

    const input = document.getElementById('question');
    const sendButton = document.getElementById('sendButton');

    input.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener("click", sendMessage);

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

    const userMessage = document.createElement("div");
    userMessage.className = "message user";
    userMessage.innerHTML = `
        <div class="message-content">${escapeHtml(text)}</div>
        <div class="message-avatar">🧑‍💻</div>
    `;
    messages.appendChild(userMessage);

    typingIndicator.style.display = 'block';
    messages.scrollTop = messages.scrollHeight;

    input.disabled = true;
    sendButton.disabled = true;

    let botMessage = null;
    let botContent = null;

    try {
        const response = await fetch("/answer/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answer: text })
        });

        if (!response.ok) {
            botMessage = document.createElement("div");
            botMessage.className = "message bot";
            botMessage.innerHTML = `
                <div class="message-avatar">👽</div>
                <div class="message-content"></div>
            `;
            botContent = botMessage.querySelector('.message-content');
            messages.appendChild(botMessage);
            const error = await response.json();
            botContent.textContent = `❌ Error: ${error.detail}`;
            botContent.classList.add('error-message');
            return;
        }
        let fullAnswer = '';
        let sources = null;
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
            let firstChunk = true;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n').filter(line => line.trim());
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.replace('data: ', '').trim();
                        if (dataStr === '[DONE]') break;
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.answer !== null) {
                                fullAnswer += data.answer;
                                if (firstChunk) {
                                    typingIndicator.style.display = 'none';
                                    botMessage = document.createElement("div");
                                    botMessage.className = "message bot";
                                    botMessage.innerHTML = `
                                        <div class="message-avatar">👽</div>
                                        <div class="message-content"></div>
                                    `;
                                    botContent = botMessage.querySelector('.message-content');
                                    messages.appendChild(botMessage);
                                    botContent.textContent = fullAnswer;
                                    messages.scrollTop = messages.scrollHeight;
                                    firstChunk = false;
                                } else {
                                    botContent.textContent = fullAnswer;
                                    messages.scrollTop = messages.scrollHeight;
                                }
                            }
                            if (data.sources !== null) {
                                sources = data.sources;
                            }
                        } catch (e) {
                            console.error('Error parsing JSON:', e);
                        }
                    }
                }
            }
            if (sources && sources.length > 0) {
                const sourcesDiv = document.createElement('div');
                sourcesDiv.className = 'sources';
                sourcesDiv.innerHTML = `<br><span style='font-size:0.9em;color:#888'>📚 Fuentes: ${sources.map(escapeHtml).join(', ')}</span>`;
                botContent.appendChild(sourcesDiv);
                messages.scrollTop = messages.scrollHeight;
            }
        } catch (error) {
            console.error('Stream error:', error);
            botContent.textContent = `❌ Error en el stream: ${error.message}`;
            botContent.classList.add('error-message');
        }

    } catch (err) {
        typingIndicator.style.display = 'none';
        if (!messages.contains(botMessage)) {
            messages.appendChild(botMessage);
        }
        botContent.textContent = "❌ Error al conectar con el servidor.";
        botContent.classList.add('error-message');
    } finally {
        input.disabled = false;
        sendButton.disabled = false;
        isTyping = false;
        input.value = "";
        input.focus();

        messages.scrollTop = messages.scrollHeight;
    }
}
