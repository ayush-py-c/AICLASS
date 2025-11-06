# Farmer Chatbot

Interactive AI chatbot for farmers. Remembers user details, provides weather, local time, multilingual responses, and speaks out assistant replies. Built with Node.js, MongoDB, and Ollama Llama3.

## Features

- 🌍 **Multilingual Support**: Automatic language detection for 16+ languages
- 🔊 **Text-to-Speech (TTS)**: High-quality voice synthesis using Reverie AI
- 📍 **Location-aware**: Weather and time information based on user location
- 💬 **Conversational AI**: Powered by Google Gemini AI
- 🗣️ **Voice Input**: Speech recognition for hands-free interaction
- 💾 **Persistent Memory**: MongoDB storage for conversation history

## Supported Languages

The chatbot supports TTS for the following languages via Reverie AI:

- **Hindi** (hi)
- **English** (en)
- **Assamese** (as)
- **Bengali** (bn)
- **Gujarati** (gu)
- **Kannada** (kn)
- **Konkani** (kok)
- **Malayalam** (ml)
- **Marathi** (mr)
- **Maithili** (mai)
- **Odia** (or)
- **Punjabi** (pa)
- **Tamil** (ta)
- **Telugu** (te)
- **Nepali** (ne)
- **Urdu** (ur)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (use `.env.example` as template):

```env
MONGO_URI=mongodb://localhost:27017/farmer-chatbot
GEMINI_API_KEY=AIzaSyBB6DE0I5_9A2AdNY2rDV8uOzhSvkAGyck
REVERIE_API_KEY=your-reverie-api-key
REVERIE_APP_ID=your-reverie-app-id
PORT=5000
```

**Get Reverie API Credentials:**

1. Sign up at [https://console.reverieit.com/](https://console.reverieit.com/)
2. Create a new app to get your API Key and App ID
3. Add them to your `.env` file

**Gemini API Key:**
The API key is already included in the example above. You can get your own from [Google AI Studio](https://makersuite.google.com/app/apikey).

**Get Reverie API Credentials:**

1. Sign up at [https://console.reverieit.com/](https://console.reverieit.com/)
2. Create a new app to get your API Key and App ID
3. Add them to your `.env` file

### 3. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# Ubuntu/Debian
sudo systemctl start mongodb

# macOS
brew services start mongodb-community
```

### 4. Run the Application

```bash
npm start
# Or for development with auto-reload:
npm run dev
```

Visit `http://localhost:5000` in your browser.

## How TTS Works

1. **Language Detection**: The app uses `franc-min` to automatically detect the language of the user's input
2. **Response Generation**: Google Gemini AI generates the chatbot response in the detected language
3. **TTS Synthesis**: The response is sent to Reverie's TTS API with the detected language code and proper headers
4. **Audio Playback**: The returned audio (WAV format, 22.05 kHz) is played automatically in the browser

The TTS system will:

- Automatically detect the language from user input
- Use Reverie TTS for supported languages
- Fallback to browser's built-in speech synthesis if Reverie fails
- Support manual language override via the dropdown

## API Endpoints

- `GET /` - Main chat interface
- `POST /stream` - SSE endpoint for streaming AI responses
- `POST /tts` - Generate TTS audio from text
- `POST /new-chat` - Clear conversation history

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini Pro
- **TTS**: Reverie AI API
- **Frontend**: EJS templates, vanilla JavaScript
- **Language Detection**: franc-min

## Troubleshooting

### TTS Not Working

- Verify your Reverie API credentials in `.env`
- Check browser console for error messages
- Ensure your API key has sufficient credits

### No Voice Output

- Check browser audio permissions
- Try using headphones if speakers don't work
- Look for audio errors in browser console

### Language Detection Issues

- Ensure input text is at least 3 characters long
- Try manually selecting language from dropdown
- Check that the language is in the supported list

## License

ISC
