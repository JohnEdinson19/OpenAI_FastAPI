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

    const botMessage = document.createElement("div");
    botMessage.className = "message bot";
    botMessage.innerHTML = `
        <div class="message-avatar">👽</div>
        <div class="message-content"></div>
    `;
    const botContent = botMessage.querySelector('.message-content');

    try {

        const response = await fetch("/answer/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ answer: text })
        });

        typingIndicator.style.display = 'none';
        messages.appendChild(botMessage);

        if (!response.ok) {
            const error = await response.json();
            botContent.textContent = `❌ Error: ${error.detail}`;
            botContent.classList.add('error-message');
            return;
        }

        const data = await response.json();
        const answer = data.answer;
        const sources = data.sources;
        const words = answer.split(/(\s+)/);
        botContent.textContent = "";
        for (let i = 0; i < words.length; i++) {
            botContent.textContent += words[i];
            messages.scrollTop = messages.scrollHeight;
            await new Promise(res => setTimeout(res, 8));
        }
        if (sources && sources.length > 0) {
            const sourcesDiv = document.createElement('div');
            sourcesDiv.className = 'sources';
            sourcesDiv.innerHTML = `<br><span style='font-size:0.9em;color:#888'>📚 Fuentes: ${sources.map(escapeHtml).join(', ')}</span>`;
            botContent.appendChild(sourcesDiv);
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
