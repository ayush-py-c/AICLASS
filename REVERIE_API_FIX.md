# Reverie TTS API Fix

## Problem
The initial implementation was missing the required `REV-APPNAME` header, causing a 404 error:
```
{"status":404,"message":"REV-APPNAME header not found"}
```

## Solution

### Correct API Call Format

```javascript
const reverieResponse = await fetch("https://revapi.reverieinc.com/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "REV-API-KEY": REVERIE_API_KEY,
    "REV-APP-ID": REVERIE_APP_ID,
    "REV-APPNAME": "tts",           // Required!
    "speaker": `${langCode}_female`, // e.g., "hi_female", "en_female"
  },
  body: JSON.stringify({
    text: textToSpeak,
  }),
});
```

### Key Changes

1. **URL**: `https://revapi.reverieinc.com/` (not `/tts` endpoint)
2. **REV-APPNAME header**: Must be set to `"tts"`
3. **speaker header**: Format is `{language}_female` or `{language}_male`
   - Examples: `hi_female`, `en_female`, `ta_male`, `as_female`
4. **Body**: Only contains `text` field, no `speaker`, `speed`, or `pitch` in body

### Available Speakers

Format: `{language_code}_{gender}`

| Language | Code | Female Speaker | Male Speaker |
|----------|------|----------------|--------------|
| Hindi | hi | hi_female | hi_male |
| English | en | en_female | en_male |
| Assamese | as | as_female | as_male |
| Bengali | bn | bn_female | bn_male |
| Gujarati | gu | gu_female | gu_male |
| Kannada | kn | kn_female | kn_male |
| Malayalam | ml | ml_female | ml_male |
| Marathi | mr | mr_female | mr_male |
| Odia | or | or_female | or_male |
| Punjabi | pa | pa_female | pa_male |
| Tamil | ta | ta_female | ta_male |
| Telugu | te | te_female | te_male |
| Nepali | ne | ne_female | ne_male |
| Urdu | ur | ur_female | ur_male |

### Response Format

- **Content-Type**: `audio/wav`
- **Sample Rate**: 22.05 kHz (22,050 Hz)
- **Channels**: Mono
- **Format**: WAV

### Testing with cURL

```bash
curl --location --request POST 'https://revapi.reverieinc.com/' \
  --header 'REV-API-KEY: <YOUR API KEY>' \
  --header 'REV-APP-ID: <YOUR APP-ID>' \
  --header 'REV-APPNAME: tts' \
  --header 'speaker: hi_female' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "text": "किसान होंगे आत्मनिर्भर, समृद्ध भारत"
  }' \
  --output output.wav
```

### Assamese Example

```bash
curl --location --request POST 'https://revapi.reverieinc.com/' \
  --header 'REV-API-KEY: <YOUR API KEY>' \
  --header 'REV-APP-ID: <YOUR APP-ID>' \
  --header 'REV-APPNAME: tts' \
  --header 'speaker: as_female' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "text": "আপোনাক স্বাগতম"
  }' \
  --output assamese_test.wav
```

## Implementation in Code

The fixed implementation:

```javascript
app.post("/tts", async (req, res) => {
  try {
    const { text, language } = req.body;
    
    // Map language code to speaker format
    const speaker = `${language || "en"}_female`;
    
    const reverieResponse = await fetch("https://revapi.reverieinc.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "REV-API-KEY": REVERIE_API_KEY,
        "REV-APP-ID": REVERIE_APP_ID,
        "REV-APPNAME": "tts",
        "speaker": speaker,
      },
      body: JSON.stringify({
        text: text.trim(),
      }),
    });
    
    const audioBuffer = await reverieResponse.buffer();
    const base64Audio = audioBuffer.toString("base64");
    
    res.json({ 
      success: true, 
      audio: base64Audio,
      mimeType: "audio/wav"
    });
  } catch (err) {
    console.error("TTS Error:", err);
    res.status(500).json({ error: err.message });
  }
});
```

## Common Errors

### 1. Missing REV-APPNAME
```json
{"status":404,"message":"REV-APPNAME header not found"}
```
**Fix**: Add `"REV-APPNAME": "tts"` to headers

### 2. Invalid Speaker
```json
{"status":400,"message":"Invalid speaker"}
```
**Fix**: Use format `{language}_female` or `{language}_male`

### 3. Authentication Failed
```json
{"status":401,"message":"Invalid API key"}
```
**Fix**: Check your `REV-API-KEY` and `REV-APP-ID`

### 4. Empty Audio
**Fix**: Ensure text is not empty and is properly UTF-8 encoded

## Best Practices

1. **Error Handling**: Always include fallback to browser speech synthesis
2. **Encoding**: Use UTF-8 encoding for all Indian language text
3. **Caching**: Consider caching audio for frequently used phrases
4. **Rate Limiting**: Monitor API usage to avoid hitting limits
5. **Testing**: Test with each language before deployment

## Debugging

Enable detailed logging:

```javascript
console.log(`🎙️  TTS Request: language="${langCode}", speaker="${speaker}"`);
console.log(`📝 Text: "${text.substring(0, 50)}..."`);
console.log(`📊 Response status: ${reverieResponse.status}`);
console.log(`🔊 Audio buffer size: ${audioBuffer.length} bytes`);
```

## Resources

- [Reverie Console](https://console.reverieit.com/)
- [Reverie Documentation](https://docs.reverieit.com/)
- API Support: Contact Reverie support team

---

**Last Updated**: November 6, 2025
