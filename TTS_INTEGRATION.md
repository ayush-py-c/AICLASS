# Reverie TTS Integration Guide

## Overview

This application now uses Reverie AI's Text-to-Speech (TTS) API to provide high-quality voice synthesis in 16+ Indian and international languages.

## Implementation Details

### Backend (`server.js`)

#### 1. Reverie API Configuration

```javascript
// Direct API configuration (no client library needed)
const REVERIE_API_KEY = process.env.REVERIE_API_KEY || "YOUR-API-KEY";
const REVERIE_APP_ID = process.env.REVERIE_APP_ID || "YOUR-APP-ID";
const REVERIE_TTS_URL = "https://revapi.reverieinc.com/tts";
```

**Note**: We use direct HTTP API calls instead of the `@reverieit/reverie-client` package because it's designed for browser use and doesn't work in Node.js environment.

#### 2. Language Mapping

- `francToReverieLang()`: Maps franc language codes to Reverie's language codes
  - Example: `eng` → `en`, `hin` → `hi`, `tam` → `ta`

#### 3. TTS Endpoint (`POST /tts`)

- Receives: `{ text: string, language: string }`
- Makes direct HTTP POST to Reverie API with headers:
  - `REV-API-KEY`: Your Reverie API key
  - `REV-APP-ID`: Your Reverie App ID
- Request body parameters:
  - `text`: The text to convert to speech
  - `speaker`: Language code (en, hi, ta, etc.)
  - `speed`: 1.0 (normal speed)
  - `pitch`: 1.0 (normal pitch)
- Returns: Base64-encoded audio data

#### 4. Streaming Enhancement

The `/stream` endpoint now sends both:

- `language`: Browser-compatible locale (e.g., `en-US`)
- `reverieLang`: Reverie language code (e.g., `en`)

### Frontend (`index.ejs`)

#### 1. Audio Playback Functions

**Primary: Reverie TTS**

```javascript
async function speakWithReverie(text, reverieLang) {
  // Calls /tts endpoint
  // Converts base64 to blob
  // Creates audio URL and plays
}
```

**Fallback: Browser Speech Synthesis**

```javascript
function speakAndWait(text, locale) {
  // Uses Web Speech API
  // Falls back if Reverie fails
}
```

#### 2. Streaming Logic

```javascript
// Capture both language codes
reverieLang = reverieLang || obj.reverieLang || null;

// Try Reverie first, fallback to browser
if (reverieLang) {
  await speakWithReverie(fullReply.trim(), reverieLang);
} else {
  await speakAndWait(fullReply.trim(), locale);
}
```

#### 3. Stop Functionality

- Stops Reverie audio: `currentAudio.pause()`
- Stops browser speech: `speechSynthesis.cancel()`

## Language Support Matrix

| Language  | Franc Code | Reverie Code | Browser Code |
| --------- | ---------- | ------------ | ------------ |
| English   | eng        | en           | en-US        |
| Hindi     | hin        | hi           | hi-IN        |
| Assamese  | asm        | as           | as-IN        |
| Bengali   | ben        | bn           | bn-IN        |
| Gujarati  | guj        | gu           | gu-IN        |
| Kannada   | kan        | kn           | kn-IN        |
| Malayalam | mal        | ml           | ml-IN        |
| Marathi   | mar        | mr           | mr-IN        |
| Odia      | ori        | or           | or-IN        |
| Punjabi   | pan        | pa           | pa-IN        |
| Tamil     | tam        | ta           | ta-IN        |
| Telugu    | tel        | te           | te-IN        |
| Nepali    | nep        | ne           | ne-NP        |
| Urdu      | urd        | ur           | ur-IN        |
| French    | fra        | fr           | fr-FR        |
| Spanish   | spa        | es           | es-ES        |

## Configuration

### Required Environment Variables

```env
REVERIE_API_KEY=your-api-key-here
REVERIE_APP_ID=your-app-id-here
```

### Getting Credentials

1. Visit [Reverie Console](https://console.reverieit.com/)
2. Sign up/Login
3. Create a new application
4. Copy API Key and App ID
5. Add to `.env` file

## Testing TTS

### Test via API

```bash
curl -X POST http://localhost:5000/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, this is a test","language":"en"}'
```

### Test via UI

1. Open the chat interface
2. Type a message in any supported language
3. The response will be automatically spoken
4. Use the language dropdown to override detection

## Error Handling

### TTS Fails Gracefully

- If Reverie API fails → Falls back to browser speech synthesis
- If browser speech fails → Text is still displayed
- If stop button pressed → Audio stops immediately

### Common Issues

**"TTS request failed"**

- Check API credentials in `.env`
- Verify network connectivity
- Check Reverie API status

**"Audio playback error"**

- Check browser audio permissions
- Try different browser
- Verify audio file format support

**Language not detected correctly**

- Use manual language override
- Ensure text is long enough (3+ chars)
- Check if language is in supported list

## API Reference

### Reverie TTS API Call

```javascript
// Direct API call using fetch
const response = await fetch("https://revapi.reverieinc.com/tts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "REV-API-KEY": REVERIE_API_KEY,
    "REV-APP-ID": REVERIE_APP_ID,
  },
  body: JSON.stringify({
    text: string, // Required: Text to synthesize
    speaker: string, // Required: Language code (en, hi, etc.)
    speed: number, // Optional: 0.5-2.0 (default: 1.0)
    pitch: number, // Optional: 0.5-2.0 (default: 1.0)
  }),
});

const audioBuffer = await response.buffer();
```

### Response Format

- Returns: Buffer (audio data)
- Format: WAV audio
- Sample Rate: Varies by language
- Channels: Mono

## Performance Considerations

### Caching

- Consider implementing audio caching for repeated phrases
- Store generated audio temporarily to reduce API calls

### Network

- TTS generation adds ~1-3 seconds latency
- Audio file size: ~50-200KB per response
- Streaming text while generating audio improves UX

### Rate Limits

- Check your Reverie plan limits
- Implement request queuing if needed
- Monitor API usage via Reverie console

## Future Enhancements

- [ ] Add voice selection (male/female)
- [ ] Implement audio caching
- [ ] Add playback speed control
- [ ] Support SSML for better prosody
- [ ] Add download audio option
- [ ] Implement audio visualization
- [ ] Add regional accent selection

## Debugging

### Enable Debug Logging

```javascript
// In server.js
console.log("TTS Request:", { text, language });
console.log("TTS Response size:", audioBuffer.length);

// In index.ejs
console.log("Using Reverie TTS for:", reverieLang);
console.log("Audio blob size:", audioBlob.size);
```

### Check API Response

```javascript
// In browser console
// Monitor network tab for /tts requests
// Check response size and format
```

## Support

- **Reverie Documentation**: [https://docs.reverieit.com/](https://docs.reverieit.com/)
- **API Issues**: Contact Reverie support
- **Implementation Questions**: Check this guide first

---

**Last Updated**: November 2025
**Version**: 1.0.0
