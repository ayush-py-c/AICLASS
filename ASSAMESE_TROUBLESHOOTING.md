# Assamese (অসমীয়া) Language Support - Troubleshooting Guide

## Overview
This guide helps troubleshoot speech recognition (input) and text-to-speech (output) issues specifically for Assamese and other Indian languages.

## Quick Diagnostics

### Check Browser Console
Open browser DevTools (F12) and look for these messages:

**Good Signs:**
- `🎤 Starting speech recognition for language: as-IN`
- `✅ Speech recognized: "..." (confidence: 0.XX)`
- `🎙️ Requesting TTS for language: as`
- `✅ TTS audio received: XXXX bytes`
- `🔊 Playing audio for language: as`

**Problem Indicators:**
- `❌ Speech recognition error: ...`
- `❌ TTS request failed: ...`
- `🔄 Falling back to browser speech synthesis`

---

## Speech Recognition (Input) Issues

### Problem: Microphone Not Working

**Symptoms:**
- Error: "No microphone found or permission denied"
- Error: "audio-capture"

**Solutions:**
1. **Check Browser Permissions:**
   ```
   Chrome: Click 🔒 icon in address bar → Site settings → Microphone → Allow
   Firefox: Click 🔒 icon → Permissions → Microphone → Allow
   ```

2. **Check System Microphone:**
   - Test your mic in system settings
   - Make sure it's not muted
   - Close other apps using the microphone

3. **HTTPS Requirement:**
   - Speech recognition requires HTTPS in production
   - For local development, `localhost` works without HTTPS

### Problem: "Language not supported"

**Symptoms:**
- Error: `Language "as-IN" not supported`
- Error: `language-not-supported`

**Background:**
Browser speech recognition support varies:
- **Chrome/Edge**: Best support for Indian languages including Assamese
- **Firefox**: Limited support for Indian languages
- **Safari**: Limited support for Indian languages

**Solutions:**
1. **Use Chrome or Edge browser** - they have the best Assamese support

2. **Check your language setting:**
   - Make sure "Assamese (as-IN)" is selected in the dropdown
   - Try selecting "Auto (browser)" if manual selection fails

3. **Verify browser language support:**
   ```javascript
   // Run this in browser console:
   if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
     console.log('Speech recognition available');
   }
   ```

4. **Install language support (Windows):**
   - Settings → Time & Language → Language
   - Add Assamese language
   - Download speech recognition pack

### Problem: No Speech Detected

**Symptoms:**
- Error: "No speech detected. Please try again."
- Error: `no-speech`

**Solutions:**
1. Speak clearly and closer to the microphone
2. Reduce background noise
3. Increase microphone volume in system settings
4. Make sure you're speaking in the selected language
5. Wait for "Listening..." indicator before speaking

### Problem: Wrong Transcription

**Symptoms:**
- Speech is recognized but text is wrong
- Confidence score is low (<0.5)

**Solutions:**
1. **Speak more clearly and slowly**
2. **Use proper Assamese pronunciation**
3. **Check you're in a quiet environment**
4. **Ensure you selected Assamese (as-IN) in the dropdown**
5. **Try typing instead if recognition is consistently poor**

---

## Text-to-Speech (Output) Issues

### Problem: No Audio Output

**Symptoms:**
- Message appears but no voice
- Console shows: `🔄 Falling back to browser speech synthesis`

**Solutions:**

1. **Check Reverie API Credentials:**
   ```bash
   # Check your .env file:
   cat .env | grep REVERIE
   
   # Should show:
   REVERIE_API_KEY=your-actual-key (not "YOUR-API-KEY")
   REVERIE_APP_ID=your-actual-id (not "YOUR-APP-ID")
   ```

2. **Verify API Key is Valid:**
   - Go to https://console.reverieit.com/
   - Check your API key is active
   - Ensure you have sufficient credits
   - Check API usage limits

3. **Test the TTS Endpoint Directly:**
   ```bash
   # Test with curl:
   curl -X POST http://localhost:5000/tts \
     -H "Content-Type: application/json" \
     -d '{"text":"নমস্কাৰ","language":"as"}'
   
   # Should return: {"success":true,"audio":"...base64..."}
   ```

4. **Check Browser Audio:**
   - Unmute your system/browser
   - Check browser's audio settings
   - Test with headphones
   - Ensure no other app is blocking audio

5. **Network Issues:**
   ```bash
   # Check if Reverie API is reachable:
   curl -I https://revapi.reverieinc.com/tts
   ```

### Problem: TTS Returns Error

**Symptoms:**
- Console: `❌ TTS request failed (400/500)`
- Console: `❌ Reverie API Error`

**Common Error Codes:**

**401 Unauthorized:**
- Invalid API key or App ID
- Solution: Check your credentials in `.env`

**400 Bad Request:**
- Invalid language code
- Empty text
- Solution: Check the language code is correct (`as` for Assamese)

**429 Too Many Requests:**
- Rate limit exceeded
- Solution: Wait a moment and try again, or upgrade your plan

**500 Server Error:**
- Reverie API issue
- Solution: Check Reverie status, try again later

### Problem: Audio Quality Issues

**Symptoms:**
- Robotic voice
- Choppy playback
- Audio cuts out

**Solutions:**
1. **Check network speed** - slow connections may cause issues
2. **Reduce text length** - break long responses into smaller chunks
3. **Clear browser cache** and reload
4. **Update your browser** to the latest version
5. **Try different speaker** (if Reverie API supports it)

---

## Language-Specific Notes

### Assamese (অসমীয়া)

**Language Codes:**
- Browser Speech Recognition: `as-IN`
- Reverie TTS: `as`
- Franc Detection: `asm`

**Character Support:**
- Assamese uses Bengali script (UTF-8)
- Ensure your text editor uses UTF-8 encoding
- Database should use UTF-8 charset

**Best Practices:**
1. Use Chrome/Edge for speech recognition
2. Type in Assamese script, not romanized
3. Speak naturally in Assamese dialect
4. Test with simple phrases first

**Test Phrases:**
```
নমস্কাৰ - Hello
আপোনাৰ নাম কি? - What is your name?
মই ভাল আছোঁ - I am fine
ধন্যবাদ - Thank you
```

---

## Debugging Checklist

### For Speech Input Issues:
- [ ] Using Chrome or Edge browser?
- [ ] Microphone permission granted?
- [ ] Correct language (as-IN) selected?
- [ ] Microphone working in other apps?
- [ ] Speaking clearly in Assamese?
- [ ] No background noise?

### For TTS Output Issues:
- [ ] REVERIE_API_KEY set in .env?
- [ ] REVERIE_APP_ID set in .env?
- [ ] API credentials are valid?
- [ ] Sufficient API credits?
- [ ] Browser audio not muted?
- [ ] Network connection stable?
- [ ] Check browser console for errors?

---

## Testing Commands

### Test Speech Recognition (Browser Console):
```javascript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'as-IN';
recognition.onresult = (e) => console.log(e.results[0][0].transcript);
recognition.onerror = (e) => console.error(e.error);
recognition.start();
// Now speak in Assamese
```

### Test TTS (Terminal):
```bash
# Test Assamese TTS
curl -X POST http://localhost:5000/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "নমস্কাৰ, মই এজন কৃষক সহায়ক",
    "language": "as"
  }' | jq '.success'

# Should output: true
```

### Check Language Detection:
```bash
# Test in Node.js:
node -e "import('franc-min').then(m => console.log(m.franc('নমস্কাৰ')))"
# Should output: asm
```

---

## Advanced Configuration

### Adjust TTS Parameters (server.js):
```javascript
// In the /tts endpoint, modify:
body: JSON.stringify({
  text: textToSpeak,
  speaker: langCode,
  speed: 0.9,  // Slower: 0.5-1.0, Faster: 1.0-2.0
  pitch: 1.1,  // Lower: 0.5-1.0, Higher: 1.0-2.0
}),
```

### Custom Language Mapping:
If detection is wrong, you can override in `server.js`:
```javascript
function francToReverieLang(code) {
  const map = {
    asm: "as",  // Assamese
    // Add more mappings...
  };
  return map[code] || "en";
}
```

---

## Getting Help

### Enable Detailed Logging:

**Backend (server.js):**
Already enabled! Check terminal output for:
- `🎙️ TTS Request: ...`
- `✅ TTS Success: ...`
- `❌ Reverie API Error: ...`

**Frontend (browser console):**
Already enabled! Open DevTools → Console

### Report Issues:

When reporting issues, include:
1. **Browser & Version**: (e.g., Chrome 120)
2. **Operating System**: (e.g., Windows 11)
3. **Language Selected**: (e.g., Assamese as-IN)
4. **Error Messages**: Copy from console
5. **Sample Text**: What you tried to say/generate
6. **API Response**: If TTS fails, include the error

### Example Bug Report:
```
Problem: Assamese TTS not working
Browser: Chrome 120 on Ubuntu 22.04
Language: Assamese (as-IN)
Error: "❌ TTS request failed (401): Invalid API key"
Action: Tried to speak "নমস্কাৰ"
Console Output: [paste full error]
```

---

## Frequently Asked Questions

**Q: Does browser speech recognition work offline?**
A: No, it requires an internet connection to Google's servers.

**Q: Can I use Reverie TTS without an API key?**
A: No, you need valid credentials. The app will fallback to browser TTS.

**Q: Which is better quality - Reverie or browser TTS?**
A: Reverie generally provides more natural-sounding voices for Indian languages.

**Q: Why does Assamese sometimes get detected as Bengali?**
A: Both use the same script. The language detection relies on vocabulary and grammar patterns.

**Q: Can I add more Assamese dialects?**
A: Check with Reverie API documentation for available dialect options.

**Q: Is there a word/character limit for TTS?**
A: Check your Reverie API plan limits. Generally, keep responses under 1000 characters.

---

## Resources

- **Reverie Documentation**: https://docs.reverieit.com/
- **Web Speech API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **Chrome Language Support**: https://cloud.google.com/speech-to-text/docs/languages
- **Franc Language Detection**: https://github.com/wooorm/franc

---

**Last Updated**: November 2025  
**Maintained by**: AICLASS Development Team  
**For urgent issues**: Check Reverie API status first
