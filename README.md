# Matrix Terminal Chatbot - n8n Integration Guide

A Matrix-themed terminal interface for interacting with an n8n chatbot via webhook. Features classic green-on-black aesthetics, typing animations, and real-time message exchange.

## 🚀 Quick Start

1. **Open the Landing Page**
   - Simply open `index.html` in a web browser
   - No build tools or server required

2. **Configure n8n Webhook**
   - Follow the setup instructions below to create your n8n workflow
   - Click the "⚙ CONFIG" button in the terminal
   - Enter your n8n webhook URL
   - Click "SAVE CONFIGURATION"

3. **Start Chatting**
   - Type your message in the terminal
   - Press ENTER or click SEND
   - Watch the bot respond with Matrix-style typing animation

## 🔧 n8n Webhook Setup

### Step 1: Create a New Workflow

1. Log into your n8n instance
2. Create a new workflow
3. Add a **Webhook** node as the trigger

### Step 2: Configure the Webhook Node

**Webhook Settings:**
- **HTTP Method**: `POST`
- **Path**: Choose a path (e.g., `/chatbot`)
- **Authentication**: None (or configure as needed)
- **Response Mode**: `Respond to Webhook`

### Step 3: Enable CORS (Critical for Browser Access)

In the Webhook node settings, add the following under **Options > Response Headers**:

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
}
```

> **Note**: For production, replace `*` with your specific domain for better security.

### Step 4: Process the Message

Add nodes to process the incoming message. The webhook receives:

```json
{
  "message": "User's message text here"
}
```

**Example processing nodes:**

1. **Set Node** - Extract the message:
   - `{{ $json.body.message }}` or `{{ $json.message }}`

2. **AI Node** (e.g., OpenAI, Anthropic Claude, etc.):
   - Send the message to your AI service
   - Process the response

3. **Function Node** (optional):
   - Add custom logic
   - Format the response

### Step 5: Return the Response

Add a **Respond to Webhook** node at the end:

**Response format (JSON):**

```json
{
  "response": "Bot's reply text here"
}
```

Alternative formats also supported:
- `{ "output": "Bot reply" }`
- `{ "message": "Bot reply" }`

### Complete Example Workflow

```
┌─────────────┐      ┌──────────┐      ┌─────────────┐      ┌──────────────┐
│   Webhook   │─────>│ Set Node │─────>│  AI Agent   │─────>│  Respond to  │
│   (POST)    │      │          │      │  (ChatGPT)  │      │   Webhook    │
└─────────────┘      └──────────┘      └─────────────┘      └──────────────┘
```

**Webhook Node:**
- Method: POST
- Path: `/chatbot`
- Response: Respond to Webhook

**Set Node:**
```javascript
// Extract message from request
message = {{ $json.body.message }}
```

**AI Node (Example: OpenAI):**
- Model: gpt-4 or gpt-3.5-turbo
- Prompt: `{{ $('Set').item.json.message }}`

**Respond to Webhook Node:**
```json
{
  "response": "{{ $json.message }}"
}
```

## 🧪 Testing Your Webhook

### Test with cURL

```bash
curl -X POST https://your-n8n-instance.com/webhook/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, bot!"}'
```

Expected response:
```json
{
  "response": "Hello! How can I help you today?"
}
```

### Test with the Landing Page

1. Open `index.html`
2. Configure webhook URL
3. Send a test message: "Hello"
4. Verify you receive a response

## 🎨 Features

### Terminal Interface
- ✅ Classic Matrix green-on-black theme
- ✅ CRT screen effects with text glow
- ✅ Typing animation for bot responses
- ✅ Real-time status indicator
- ✅ Timestamps for all messages
- ✅ Responsive design (mobile-friendly)

### Functionality
- ✅ LocalStorage for webhook URL persistence
- ✅ Error handling (network, timeout, invalid responses)
- ✅ 30-second request timeout
- ✅ Clear chat history
- ✅ Welcome message on load
- ✅ Keyboard shortcuts (Enter to send)

## 🔒 Security Considerations

### For Development
The current setup uses:
- No authentication (easy testing)
- Open CORS (`Access-Control-Allow-Origin: *`)

### For Production

1. **Enable Webhook Authentication:**
   - Use Header Auth or Basic Auth in n8n webhook
   - Update `script.js` to include auth headers

2. **Restrict CORS:**
   ```json
   {
     "Access-Control-Allow-Origin": "https://yourdomain.com"
   }
   ```

3. **Use HTTPS:**
   - Always use SSL/TLS for production
   - Ensures encrypted communication

4. **Rate Limiting:**
   - Implement rate limiting in n8n or reverse proxy
   - Prevents abuse

5. **Input Validation:**
   - Validate and sanitize user input in n8n
   - Prevent injection attacks

## 🛠️ Customization

### Modify Webhook URL Programmatically

Edit `script.js`:
```javascript
const CONFIG_KEY = 'matrix_chatbot_webhook_url';
// On line ~46, change the default:
webhookUrl = localStorage.getItem(CONFIG_KEY) || 'YOUR_DEFAULT_URL';
```

### Change Typing Speed

Edit `script.js`:
```javascript
const TYPING_SPEED = 30; // milliseconds per character (lower = faster)
```

### Adjust Request Timeout

Edit `script.js`:
```javascript
const API_TIMEOUT = 30000; // milliseconds (30 seconds)
```

### Customize Colors

Edit `styles.css`:
```css
:root {
    --matrix-green: #00ff00;     /* Main text color */
    --matrix-dark-green: #003300; /* Darker accent */
    --matrix-bg: #000000;         /* Background */
}
```

### Change Terminal Title

Edit `index.html`:
```html
<span>MATRIX_CHAT_v1.0</span>  <!-- Line ~18 -->
```

## 🐛 Troubleshooting

### "Network error. Check webhook URL and CORS settings."

**Cause**: CORS headers not configured in n8n webhook.

**Solution**:
1. Open your n8n workflow
2. Edit the Webhook node
3. Add CORS headers as shown in Step 3 above
4. Save and activate the workflow

### "Request timeout. Please try again."

**Cause**: n8n workflow taking longer than 30 seconds.

**Solution**:
- Optimize your workflow
- Reduce AI response time
- Increase timeout in `script.js` (not recommended)

### Messages not appearing

**Cause**: Incorrect response format from n8n.

**Solution**: Ensure n8n returns JSON with one of:
- `{ "response": "text" }`
- `{ "output": "text" }`
- `{ "message": "text" }`

### Status shows "OFFLINE"

**Cause**: Webhook URL not configured.

**Solution**:
1. Click "⚙ CONFIG" button
2. Enter your webhook URL
3. Click "SAVE CONFIGURATION"

## 📝 Response Format Examples

Your n8n workflow can return any of these formats:

```json
// Option 1 (recommended)
{ "response": "Hello! How can I help you?" }

// Option 2
{ "output": "Hello! How can I help you?" }

// Option 3
{ "message": "Hello! How can I help you?" }

// Option 4 (plain string - will be displayed as-is)
"Hello! How can I help you?"
```

## 🌐 Hosting Options

### Local Testing
- Just open `index.html` in your browser
- Works immediately, no server needed

### Static Hosting (Free Options)
- **GitHub Pages**: Push to repo, enable Pages
- **Netlify**: Drag & drop folder
- **Vercel**: Connect repo or drag & drop
- **Cloudflare Pages**: Connect repo

### Custom Domain
All hosting platforms above support custom domains.

## 📚 Additional Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Webhook Trigger](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [CORS Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## 🤝 Support

If you encounter issues:
1. Check the browser console for errors (F12)
2. Verify your n8n webhook is responding with cURL
3. Ensure CORS headers are properly configured
4. Check that your webhook URL is correct

## 📄 License

This project is provided as-is for educational and personal use.

---

**Ready to chat with the Matrix?** 🟢 Configure your webhook and start the conversation!
