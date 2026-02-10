// Petal & Bloom Flower Shop Assistant - JavaScript

// Configuration
const CONFIG_KEY = 'matrix_chatbot_webhook_url';
const METHOD_KEY = 'matrix_chatbot_http_method';
const TYPING_SPEED = 30; // milliseconds per character
const API_TIMEOUT = 30000; // 30 seconds

// DOM Elements
let elements = {};

// State
let isTyping = false;
let webhookUrl = '';
let httpMethod = 'GET'; // GET is the configured method

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    loadConfiguration();
    setupEventListeners();
    displayWelcomeMessage();
    initPetalCanvas();
});

// Initialize DOM element references
function initializeElements() {
    elements = {
        messageContainer: document.getElementById('messageContainer'),
        messageInput: document.getElementById('messageInput'),
        sendButton: document.getElementById('sendButton'),
        configPanel: document.getElementById('configPanel'),
        configButton: document.getElementById('configButton'),
        configToggle: document.getElementById('configToggle'),
        clearButton: document.getElementById('clearButton'),
        webhookUrlInput: document.getElementById('webhookUrl'),
        httpMethodSelect: document.getElementById('httpMethod'),
        saveConfigButton: document.getElementById('saveConfig'),
        statusIndicator: document.getElementById('statusIndicator'),
        statusText: document.getElementById('statusText'),
        terminalBody: document.getElementById('terminalBody')
    };
}

// Load webhook URL from localStorage
function loadConfiguration() {
    webhookUrl = localStorage.getItem(CONFIG_KEY) || '';
    httpMethod = localStorage.getItem(METHOD_KEY) || 'GET';

    if (webhookUrl) {
        elements.webhookUrlInput.value = webhookUrl;
        elements.httpMethodSelect.value = httpMethod;
        updateStatus(true);
        enableInput();
    } else {
        showConfigPanel();
        updateStatus(false);
    }
}

// Save webhook URL to localStorage
function saveConfiguration() {
    const url = elements.webhookUrlInput.value.trim();
    const method = elements.httpMethodSelect.value;

    if (!url) {
        addMessage('system', 'Please enter a valid webhook URL.');
        return;
    }

    // Basic URL validation
    try {
        new URL(url);
        webhookUrl = url;
        httpMethod = method;
        localStorage.setItem(CONFIG_KEY, url);
        localStorage.setItem(METHOD_KEY, method);
        updateStatus(true);
        enableInput();
        hideConfigPanel();
        addMessage('system', `מחוברים! סודי מוכנה לעזור לכם. \u273F`);
    } catch (error) {
        addMessage('error', 'Invalid URL format. Please check and try again.');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Send message on button click
    elements.sendButton.addEventListener('click', handleSendMessage);

    // Send message on Enter key
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isTyping) {
            handleSendMessage();
        }
    });

    // Config panel toggle
    elements.configButton.addEventListener('click', toggleConfigPanel);
    elements.configToggle.addEventListener('click', hideConfigPanel);

    // Save configuration
    elements.saveConfigButton.addEventListener('click', saveConfiguration);

    // Clear chat history
    elements.clearButton.addEventListener('click', clearChat);
}

function getErrorGuidance(message) {
    if (message.includes('There was a problem executing the workflow'))
        return 'Check the Executions tab in n8n for the failing node. Common causes: AI/LLM node credentials not configured, or a misconfigured node.';
    if (message.includes('Workflow is not active') || message.includes('is not registered'))
        return 'Activate your workflow in n8n using the toggle in the top-right of the editor.';
    if (message.includes('Network error') || message.includes('Failed to fetch'))
        return 'Cannot reach n8n. Verify the webhook URL is correct and n8n is running.';
    if (message.includes('timeout'))
        return 'n8n took too long to respond. Check that the AI node has valid credentials and is not rate-limited.';
    if (message.includes('HTTP 404'))
        return 'Webhook not found. Check the URL and ensure the HTTP method (GET/POST) matches the webhook node setting in n8n.';
    return null;
}

// Handle sending a message
async function handleSendMessage() {
    const message = elements.messageInput.value.trim();

    if (!message || isTyping) {
        return;
    }

    if (!webhookUrl) {
        addMessage('error', 'Please configure the webhook URL first.');
        showConfigPanel();
        return;
    }

    // Clear input and disable while processing
    elements.messageInput.value = '';
    disableInput();

    // Display user message
    addMessage('user', message);

    try {
        // Send to n8n webhook
        const response = await sendToWebhook(message);

        // Display bot response with typing effect
        await addMessageWithTyping('bot', response);

    } catch (error) {
        const guidance = getErrorGuidance(error.message);
        addMessage('error', `Error: ${error.message}${guidance ? '\n\n' + guidance : ''}`);
    } finally {
        enableInput();
        elements.messageInput.focus();
    }
}

// Send message to n8n webhook
async function sendToWebhook(message) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        let response;

        if (httpMethod === 'GET') {
            // GET request with query parameter
            const url = new URL(webhookUrl);
            url.searchParams.append('message', message);

            response = await fetch(url.toString(), {
                method: 'GET',
                signal: controller.signal
            });
        } else {
            // POST request with JSON body (n8n default)
            response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message }),
                signal: controller.signal
            });
        }

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await response.text();
            let errDetail = response.statusText;
            try {
                const errData = JSON.parse(errText);
                if (errData.message) errDetail = errData.message;
                else if (errData.hint) errDetail = errData.hint;
            } catch {}
            throw new Error(`HTTP ${response.status}: ${errDetail}`);
        }

        // Improved JSON parsing with error handling
        const responseText = await response.text();

        if (!responseText || responseText.trim() === '') {
            throw new Error('Empty response from webhook. Check n8n workflow.');
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (jsonError) {
            console.error('Response text:', responseText);
            throw new Error(`Invalid JSON: ${responseText.substring(0, 50)}...`);
        }

        // Handle different response formats
        // n8n format: [{ "text": "response" }]
        if (Array.isArray(data) && data.length > 0 && data[0].text) {
            return data[0].text;
        }
        // Standard formats
        else if (data.response) {
            return data.response;
        } else if (data.output) {
            return data.output;
        } else if (data.message) {
            return data.message;
        } else if (data.text) {
            return data.text;
        } else if (typeof data === 'string') {
            return data;
        } else {
            return JSON.stringify(data);
        }

    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout. Please try again.');
        } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error. Check webhook URL and CORS settings.');
        } else {
            throw error;
        }
    }
}

// Add a message to the chat
function addMessage(type, content, timestamp = new Date()) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const senderNames = {
        'user': 'את/ה',
        'bot': 'סודי',
        'system': 'סוד ירוק',
        'error': 'הודעה'
    };

    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-sender">${senderNames[type] || 'Unknown'}</span>
            <span class="message-time">${formatTime(timestamp)}</span>
        </div>
        <div class="message-content">${escapeHtml(content)}</div>
    `;

    elements.messageContainer.appendChild(messageDiv);
    scrollToBottom();

    return messageDiv;
}

// Add a message with typing animation
async function addMessageWithTyping(type, content) {
    isTyping = true;

    const timestamp = new Date();
    const messageDiv = addMessage(type, '', timestamp);
    const contentDiv = messageDiv.querySelector('.message-content');

    // Type out the message character by character
    for (let i = 0; i < content.length; i++) {
        contentDiv.textContent += content[i];
        scrollToBottom();
        await sleep(TYPING_SPEED);
    }

    isTyping = false;
}

// Display welcome message
function displayWelcomeMessage() {
    const welcomeText = `ברוכים הבאים לסוד ירוק \u273F
שלום! אני סודי, העוזרת האישית שלכם בחנות הפרחים.
אני יכולה לעזור לכם עם:
  \u2022 סידורי פרחים וזרים
  \u2022 זמינות עונתית ומחירים
  \u2022 טיפים לטיפול בפרחים
  \u2022 מציאת המתנה המושלמת לכל אירוע`;

    addMessage('system', welcomeText);
}

// Clear chat history
function clearChat() {
    if (confirm('למחוק את השיחה ולהתחיל מחדש?')) {
        elements.messageContainer.innerHTML = '';
        displayWelcomeMessage();
    }
}

// Show configuration panel
function showConfigPanel() {
    elements.configPanel.classList.add('show');
}

// Hide configuration panel
function hideConfigPanel() {
    elements.configPanel.classList.remove('show');
}

// Toggle configuration panel
function toggleConfigPanel() {
    elements.configPanel.classList.toggle('show');
}

// Enable input
function enableInput() {
    elements.messageInput.disabled = false;
    elements.sendButton.disabled = false;
}

// Disable input
function disableInput() {
    elements.messageInput.disabled = true;
    elements.sendButton.disabled = true;
}

// Update connection status
function updateStatus(isOnline) {
    if (isOnline) {
        elements.statusIndicator.classList.add('online');
        elements.statusText.textContent = 'ONLINE';
    } else {
        elements.statusIndicator.classList.remove('online');
        elements.statusText.textContent = 'OFFLINE';
    }
}

// Scroll to bottom of messages
function scrollToBottom() {
    elements.terminalBody.scrollTop = elements.terminalBody.scrollHeight;
}

// Format time as HH:MM:SS
function formatTime(date) {
    return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sleep utility
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Prevent form submission if wrapped in a form
document.addEventListener('submit', (e) => {
    e.preventDefault();
});

// ============================================
// Floating Petal Canvas Animation
// ============================================

let petalCanvas, petalCtx;
let petals = [];

// Petal colors: green/gold/white botanical tones
const petalColors = [
    [122, 158, 126],   // green-sage  #7A9E7E
    [78, 124, 87],     // green-mid   #4E7C57
    [201, 150, 74],    // gold        #C9964A
    [168, 196, 171],   // sage-light  #A8C4AB
    [212, 197, 160],   // cream-warm  #D4C5A0
];

// Initialize the floating petal canvas animation
function initPetalCanvas() {
    petalCanvas = document.getElementById('petalCanvas');
    if (!petalCanvas) {
        console.error('Petal canvas not found');
        return;
    }

    petalCtx = petalCanvas.getContext('2d');

    // Set canvas size to window size
    petalCanvas.width = window.innerWidth;
    petalCanvas.height = window.innerHeight;

    // Create 40 petal objects
    petals = [];
    for (let i = 0; i < 40; i++) {
        petals.push(createPetal());
    }

    // Start animation loop
    animatePetals();

    // Handle window resize
    window.addEventListener('resize', () => {
        petalCanvas.width = window.innerWidth;
        petalCanvas.height = window.innerHeight;
    });
}

// Create a single petal with random properties
function createPetal(fromTop = false) {
    const colorArr = petalColors[Math.floor(Math.random() * petalColors.length)];
    return {
        x: Math.random() * (petalCanvas ? petalCanvas.width : window.innerWidth),
        y: fromTop
            ? -10
            : Math.random() * (petalCanvas ? petalCanvas.height : window.innerHeight),
        size: 3 + Math.random() * 5,           // 3–8 px
        opacity: 0.2 + Math.random() * 0.4,    // 0.2–0.6
        speedY: 0.4 + Math.random() * 0.8,     // 0.4–1.2
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.03,  // ±0.015
        color: colorArr,
    };
}

// Main petal animation loop
function animatePetals() {
    petalCtx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);

    petals.forEach((petal, index) => {
        petalCtx.save();
        petalCtx.translate(petal.x, petal.y);
        petalCtx.rotate(petal.rotation);
        petalCtx.globalAlpha = petal.opacity;
        petalCtx.fillStyle = `rgb(${petal.color[0]}, ${petal.color[1]}, ${petal.color[2]})`;

        // Draw ellipse as a petal shape
        petalCtx.beginPath();
        petalCtx.ellipse(0, 0, petal.size * 2, petal.size * 0.45, 0, 0, Math.PI * 2);
        petalCtx.fill();

        petalCtx.restore();

        // Update position
        petal.y += petal.speedY;
        petal.x += Math.sin(petal.y * 0.02) * 0.5;
        petal.rotation += petal.rotationSpeed;

        // Recycle petal to top when it falls off-screen
        if (petal.y > petalCanvas.height + 20) {
            petals[index] = createPetal(true);
        }
    });

    requestAnimationFrame(animatePetals);
}
