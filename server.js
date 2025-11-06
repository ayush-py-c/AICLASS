// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Make sure these model files exist in ./models/message and ./models/memory
const Message = require("./models/message");
const Memory = require("./models/memory");

// dynamic import for fetch (works in many Node versions)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Gemini AI configuration
const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "AIzaSyBB6DE0I5_9A2AdNY2rDV8uOzhSvkAGyck";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Reverie API configuration (direct API calls)
const REVERIE_API_KEY = process.env.REVERIE_API_KEY || "YOUR-API-KEY";
const REVERIE_APP_ID = process.env.REVERIE_APP_ID || "YOUR-APP-ID";
const REVERIE_TTS_URL = "https://revapi.reverieinc.com/";

// dynamic import for franc-min (language detection)
let franc = () => "eng";
import("franc-min")
  .then((m) => {
    franc = m.franc;
  })
  .catch(() => {
    console.warn("franc-min not found, defaulting to eng");
    franc = () => "eng";
  });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Cache for weather/location/time to reduce repeated API calls ---
const locationCache = new Map(); // key = "lat,lon", value = { weatherText, timezone, city, lastUpdated }

// --- Helper: get weather + timezone + city ---
async function getWeatherTimeCity(lat, lon) {
  const key = `${lat},${lon}`;
  const now = Date.now();
  // return cached if <5 mins old
  if (locationCache.has(key)) {
    const cached = locationCache.get(key);
    if (now - cached.lastUpdated < 5 * 60 * 1000) return cached;
  }

  try {
    // weather/time using open-meteo (free)
    const weatherResp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
    );
    const weatherData = await weatherResp.json();
    const { temperature, weathercode } = weatherData.current_weather || {};
    const weatherMap = {
      0: "Clear",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      61: "Rain",
      80: "Showers",
    };
    const weatherText =
      temperature !== undefined
        ? `Temp: ${temperature}°C, ${weatherMap[weathercode] || "Unknown"}`
        : "";

    // city via reverse geocoding (Nominatim)
    const geoResp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const geoData = await geoResp.json();
    const city =
      geoData.address?.city ||
      geoData.address?.town ||
      geoData.address?.state ||
      "Unknown";

    const timezone = weatherData.timezone || "UTC";

    const result = { weatherText, timezone, city, lastUpdated: now };
    locationCache.set(key, result);
    return result;
  } catch (e) {
    console.error("getWeatherTimeCity error", e);
    return {
      weatherText: "",
      timezone: "UTC",
      city: "Unknown",
      lastUpdated: now,
    };
  }
}

// --- franc to Reverie TTS language code
function francToReverieLang(code) {
  // Mapping franc language codes to Reverie language codes
  const map = {
    eng: "en", // English
    hin: "hi", // Hindi
    tam: "ta", // Tamil
    tel: "te", // Telugu
    kan: "kn", // Kannada
    asm: "as", // Assamese
    ben: "bn", // Bengali
    guj: "gu", // Gujarati
    mal: "ml", // Malayalam
    mar: "mr", // Marathi
    pan: "pa", // Punjabi
    ori: "or", // Odia
    urd: "ur", // Urdu
    nep: "ne", // Nepali
    fra: "fr", // French (keeping for compatibility)
    spa: "es", // Spanish (keeping for compatibility)
  };
  return map[code] || "en";
}

// --- franc to speech locale (for browser compatibility)
function francToSpeechLang(code) {
  const map = {
    eng: "en-US",
    hin: "hi-IN",
    tam: "ta-IN",
    tel: "te-IN",
    kan: "kn-IN",
    fra: "fr-FR",
    spa: "es-ES",
    asm: "as-IN",
    ben: "bn-IN",
    guj: "gu-IN",
    mal: "ml-IN",
    mar: "mr-IN",
    pan: "pa-IN",
    ori: "or-IN",
    urd: "ur-IN",
    nep: "ne-NP",
  };
  return map[code] || "en-US";
}

// --- ROUTES ---
app.get("/", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 }).lean();
    res.render("index", { messages });
  } catch (e) {
    console.error("GET / error", e);
    res.render("index", { messages: [] });
  }
});

app.post("/new-chat", async (req, res) => {
  try {
    await Message.deleteMany({});
    await Memory.deleteMany({});
    res.json({ success: true });
  } catch (e) {
    console.error("POST /new-chat error", e);
    res.status(500).json({ error: "Server error while clearing chat" });
  }
});

// --- TTS endpoint using Reverie ---
app.post("/tts", async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text || !text.trim()) {
      console.error("TTS Error: Empty text provided");
      return res.status(400).json({ error: "Text is required" });
    }

    // Validate API credentials
    if (!REVERIE_API_KEY || REVERIE_API_KEY === "YOUR-API-KEY") {
      console.error("TTS Error: Reverie API key not configured");
      return res.status(500).json({
        error: "TTS service not configured. Please set REVERIE_API_KEY in .env",
        fallback: true,
      });
    }

    if (!REVERIE_APP_ID || REVERIE_APP_ID === "YOUR-APP-ID") {
      console.error("TTS Error: Reverie App ID not configured");
      return res.status(500).json({
        error: "TTS service not configured. Please set REVERIE_APP_ID in .env",
        fallback: true,
      });
    }

    const langCode = language || "en";
    // Map language code to speaker format (e.g., "hi_female", "en_female")
    const speaker = `${langCode}_female`;

    console.log(
      `🎙️  TTS Request: language="${langCode}", speaker="${speaker}", text="${text.substring(
        0,
        50
      )}${text.length > 50 ? "..." : ""}" (${text.length} chars)`
    );

    // Special handling for Assamese - ensure proper encoding
    const textToSpeak = text.trim();

    // Call Reverie TTS API directly with correct headers
    const reverieResponse = await fetch(REVERIE_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "REV-API-KEY": REVERIE_API_KEY,
        "REV-APP-ID": REVERIE_APP_ID,
        "REV-APPNAME": "tts",
        speaker: speaker,
      },
      body: JSON.stringify({
        text: textToSpeak,
      }),
    });

    if (!reverieResponse.ok) {
      const errorText = await reverieResponse
        .text()
        .catch(() => "Unknown error");
      console.error(
        `❌ Reverie API Error [${reverieResponse.status}] for language "${langCode}":`,
        errorText
      );

      // Return error with fallback flag
      return res.status(reverieResponse.status).json({
        error: `Reverie TTS failed for language "${langCode}": ${errorText}`,
        fallback: true,
        language: langCode,
      });
    }

    // Get audio buffer from response
    const audioBuffer = await reverieResponse.buffer();

    if (!audioBuffer || audioBuffer.length === 0) {
      console.error(
        `❌ TTS Error: Empty audio buffer received for language "${langCode}"`
      );
      return res.status(500).json({
        error: "Empty audio received from TTS service",
        fallback: true,
        language: langCode,
      });
    }

    console.log(
      `✅ TTS Success: Generated ${audioBuffer.length} bytes for language "${langCode}"`
    );

    // Convert buffer to base64 for sending to client
    const base64Audio = audioBuffer.toString("base64");

    res.json({
      success: true,
      audio: base64Audio,
      mimeType: "audio/wav",
      language: langCode,
    });
  } catch (err) {
    console.error("❌ /tts error:", err.message || err);
    console.error("Stack:", err.stack);
    res.status(500).json({
      error: err.message || "TTS generation failed",
      fallback: true,
    });
  }
});

// --- SSE streaming endpoint ---
app.post("/stream", async (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders?.();

  const { prompt: userText, location, langOverride } = req.body;
  if (!userText?.trim()) {
    res.write(`data: ${JSON.stringify({ error: "Empty prompt" })}\n\n`);
    return res.end();
  }

  try {
    const trimmed = userText.trim();

    // Language detection
    let langCode = "eng";
    try {
      langCode =
        franc(trimmed, {
          minLength: 3,
          only: [
            "eng",
            "hin",
            "tam",
            "tel",
            "kan",
            "fra",
            "spa",
            "asm",
            "ben",
            "guj",
            "mal",
            "mar",
            "pan",
            "ori",
            "urd",
            "nep",
          ],
        }) || "eng";
    } catch (e) {
      langCode = "eng";
    }
    if (langOverride && langOverride !== "auto")
      langCode = langOverride.split("-")[0];
    const speechLang = francToSpeechLang(langCode);
    const reverieLang = francToReverieLang(langCode);

    // Save user message
    await Message.create({
      text: trimmed,
      role: "user",
      language: langCode,
      createdAt: new Date(),
    });

    // Build context for model (last 5 messages)
    const prevMessages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    const context = prevMessages
      .reverse()
      .map((m) => `${m.role}: ${m.text}`)
      .join("\n");
    const memories = await Memory.find().lean();
    const memoryContext = memories
      .map((m) => `${m.key}: ${m.value}`)
      .join(", ");

    // weather/time/city info
    let weatherText = "",
      timezone = "UTC",
      city = "Unknown";
    if (location?.lat && location?.lon) {
      const locData = await getWeatherTimeCity(location.lat, location.lon);
      weatherText = locData.weatherText;
      timezone = locData.timezone;
      city = locData.city;
    }

    const now = new Date();
    const localTime = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
    }).format(now);
    const localDate = new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone,
    }).format(now);

    const systemPrompt = `You are a helpful farmer assistant. The user is speaking ${langCode}. You MUST reply in the same language.
Current context:
- User's previous messages: ${context}
- Remembered facts: ${memoryContext}
- Current Date/Time in user's location (${city}): ${localDate}, ${localTime}.
- Current Weather: ${weatherText || "Not requested"}

Important: Respond ONLY with your answer in ${langCode} language. Do not include any system prompts or internal thoughts in your response.`;

    console.log(`🤖 Gemini: Generating response in language: ${langCode}`);

    // Use Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fullPrompt = `${systemPrompt}\n\nUser: ${trimmed}\n\nAssistant:`;

    // Generate response with streaming
    const result = await model.generateContentStream(fullPrompt);

    let fullReply = "";

    // Stream the response
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        fullReply += chunkText;
        // Send SSE token event with both speechLang and reverieLang
        res.write(
          `data: ${JSON.stringify({
            token: chunkText,
            language: speechLang,
            reverieLang: reverieLang,
          })}\n\n`
        );
      }
    }

    // Save assistant message
    await Message.create({
      text: fullReply,
      role: "assistant",
      language: langCode,
      createdAt: new Date(),
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("/stream error", err);
    res.write(
      `data: ${JSON.stringify({ error: err.message || "Unknown error" })}\n\n`
    );
    res.end();
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚜 Server running at http://localhost:${PORT}`)
);
