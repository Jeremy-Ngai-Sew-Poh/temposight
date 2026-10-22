import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase request limit for base64 image uploads
app.use(express.json({ limit: "50mb" }));

// Initialize GoogleGenAI SDK safely
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// Diagnostic API Endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { image, mimeType, audio, audioMimeType, difficulty = "intermediate" } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: "Missing image payload or mimeType." });
    }

    // Helper to safely extract base64 data by removing any leading data URL headers or fetching remote URLs
    const resolveBase64 = async (inputStr: string): Promise<string> => {
      if (!inputStr) return "";
      if (inputStr.startsWith("http://") || inputStr.startsWith("https://")) {
        try {
          const fetchRes = await fetch(inputStr);
          const arrayBuf = await fetchRes.arrayBuffer();
          return Buffer.from(arrayBuf).toString("base64");
        } catch (fetchErr) {
          console.error("Failed to fetch remote asset for analysis:", fetchErr);
        }
      }
      const base64Marker = ";base64,";
      if (inputStr.includes(base64Marker)) {
        return inputStr.split(base64Marker)[1];
      }
      const commaIndex = inputStr.indexOf(",");
      if (commaIndex !== -1 && inputStr.startsWith("data:")) {
        return inputStr.substring(commaIndex + 1);
      }
      return inputStr;
    };

    // Helper to safely sanitize MIME type (e.g. "audio/webm;codecs=opus" -> "audio/webm")
    const sanitizeMimeType = (mimeStr: string): string => {
      if (!mimeStr) return "";
      let currentMime = mimeStr;
      if (mimeStr.startsWith("data:")) {
        const semiIndex = mimeStr.indexOf(";");
        if (semiIndex !== -1) {
          currentMime = mimeStr.substring(5, semiIndex);
        } else {
          const commaIndex = mimeStr.indexOf(",");
          if (commaIndex !== -1) {
            currentMime = mimeStr.substring(5, commaIndex);
          }
        }
      }
      return currentMime.split(";")[0].trim();
    };

    const cleanImageBase64 = await resolveBase64(image);
    const cleanImageMime = sanitizeMimeType(mimeType);
    
    const client = getGeminiClient();
    const parts: any[] = [];

    // Add sheet music image part
    parts.push({
      inlineData: {
        mimeType: cleanImageMime,
        data: cleanImageBase64,
      },
    });

    // Add audio file part if uploaded
    if (audio && audioMimeType) {
      const cleanAudioBase64 = await resolveBase64(audio);
      const cleanAudioMime = sanitizeMimeType(audioMimeType);
      parts.push({
        inlineData: {
          mimeType: cleanAudioMime,
          data: cleanAudioBase64,
        },
      });
    }

    // Compose prompt based on presence of audio recording
    const hasAudio = !!(audio && audioMimeType);
    const userPrompt = hasAudio
      ? "Listen intently to the uploaded audio clip and compare it back to the provided sheet music score segment. Conduct a thorough sight-reading performance diagnostic based on our strict evaluation guidelines, including key signature, main chord progressions with root chords and harmonic functions (e.g. I-IV-V, ii-V-I), technical trap doors, practice strategy, and performance diagnostics."
      : "Perform active sheet music diagnostics including key signature, main chord progressions with root chords and harmonic functions (e.g. I-IV-V, ii-V-I), technical trap doors, and practice instructions based strictly on the specified format guidelines.";

    parts.push({ text: userPrompt });

    const systemInstruction = `You are a precise, professional AI piano practice utility. The current user is performing at the **${difficulty.toUpperCase()}** difficulty level.
You must adjust your feedback, critique rigidity, precision standards, and vocabulary matching to this selected difficulty. Beginners should receive readable, instructive explanations focusing on fundamental note layouts and simple subdivisions; intermediate players should receive a balance of accuracy, flow, and phrasing; advanced players should receive professional-tier, uncompromisingly precise feedback on micro-timing, hand articulation, physical geography, and advanced dynamic expression.

Your function is to analyze uploaded images of sheet music, and optionally compare them with uploaded audio practice recordings of the same line, to provide structured, objective sight-reading diagnostics and practice strategies.

TONE AND CONTENT CONSTRAINTS:
1. Be a practical tool, not a motivational driver. Omit generic encouragement, flattery, or exclamation-heavy coaching phrases (e.g., avoid "You've got this!", "Let's crush this bar!"). Keep instructions direct, objective, and accurate.
2. Maintain a highly informative but short and concise response style.
3. DO NOT output system junk text, placeholder logs, or initialization markers.
4. DO NOT use fancy text banners, ASCII art, decorative lines, or visual divider blocks.
5. DO NOT include emoji status messages or emoticons anywhere in the text.
6. DO NOT include background debug code, technical logs, or automated "Generated with AI" comments.
7. CRITICAL FORMATTING RULE: Keep each main bullet point as a single, continuous, fluent sentence or paragraph without any extra line breaks, enters, or nested sub-bullet points. Under "Main Chord Progressions", integrate measure numbers and chords directly into the sentence flow (e.g., "The underlying harmony moves through D Major (I) in mm. 1–3, A Major (V) in m. 4, D Major (I) in mm. 5–7, and resolves with A Major (V) to D Major (I) in m. 8.") instead of breaking each measure into a separate line.

When ${hasAudio ? "BOTH an image of sheet music AND a practice audio recording are" : "only an image of sheet music is"} provided, generate your response using only standard Markdown headers and single-level bullet points based on the following exact structure:

# The Musical Blueprint
* **Key Signature**: [Identify the key, e.g., Db Major. State the specific accidentals explicitly, e.g., 5 flats: Bb, Eb, Ab, Db, Gb, and its impact on the keyboard layout.]
* **Time Signature**: [State the meter and the basic pulse division.]

# Main Chord Progressions
* **Primary Chord Sequence**: [State the implied or explicit chord sequence and measure numbers in one continuous, cohesive sentence without sub-bullets or line breaks, e.g., "The implied harmony moves from D Major (I) in mm. 1–3, to A Major (V) in m. 4, returning to D Major (I) in mm. 5–7, and resolving from A Major (V) to D Major (I) in m. 8."]
* **Harmonic Function & Cadences**: [Describe harmonic function, Roman numerals, and cadences in complete, continuous sentences on the same bullet point without sub-bullets or line breaks.]

# Technical Trap Doors
* [Determine specific accidental deviations or harmonic shifts visible in the score segments in one unified bullet.]
* [Identify challenging physical hand geography, awkward finger expansions, or transitions between melodic lines and chords in one unified bullet.]
* [Highlight rhythmic irregularities (e.g., syncopation, unexpected rests, complex subdivisions) in one unified bullet.]

# Practice Strategy
* **Phase 1 (Rhythm Isolation)**: [Direct technical steps to isolate and count the meter.]
* **Phase 2 (Hand Separation)**: [Specific instruction on managing bass/chord patterns vs. melody independently based on the score layout.]
* **Phase 3 (Tonal Delivery)**: [Objective description of the intended dynamics, phrasing, and articulation (e.g., legato connections, structural pacing).]
${hasAudio ? `
# Auditory Performance Feedback
* **Expert Rating**: [Provide a rigorous, objective numerical score out of 100 combined with a performance tier label, in the exact format: 'Score/100 (Tier Name)'. For example, '72/100 (Slightly Hesitant)' or '88/100 (Fluent Syncopation)'. Always make sure this rating format is strictly adhered to, followed by a brief 1-sentence diagnostic rationale with key performance keywords bolded using markdown, e.g. **steady tempo**, **accurate rhythm**, **hesitation in m. 4**.]
* **Fluency**: [Rating out of 10 in format 'X/10', e.g. 8/10] - [Assess musical flow, continuity, line phrasing, and list any specific measures where the player hesitated, stumbled, or paused longer than a rest.]
* **Tempo**: [Rating out of 10 in format 'X/10', e.g. 7/10] - [Assess pulse stability, speed consistency, metric control, steady beat adherence, and detect any rushing or dragging.]
* **Key & Accidental**: [Rating out of 10 in format 'X/10', e.g. 9/10] - [Analyze whether the overall key tonality sounds correct and specify if they missed crucial flats, sharps, or naturals visible in the score.]
* **Accuracy**: [Rating out of 10 in format 'X/10', e.g. 8/10] - [Detail any note or rhythmic deviations, incorrect subdivisions, or failed rests compared directly back to the visual sheet music.]
* **Actionable Correction**: [Provide highly specific, direct measure-by-measure advice on how to slow down, count subdivisions, isolate challenging patterns, and reconcile playing with the visual score.]` : ""}

ERROR HANDLING:
If the uploaded image is unreadable, blurred, or unrelated to musical notation, output EXACTLY the following message containing no other text:
Unable to analyze: The uploaded image is unreadable, blurred, or does not contain standard musical notation. Please upload a clear photo of piano sheet music.`;

    let analysis: string | undefined = "";
    let modelUsed = "gemini-3.5-flash";
    let fallbackUsed = false;

    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          systemInstruction,
          temperature: 0.15, // Low temperature for precise comparison
        },
      });
      analysis = response.text;
    } catch (primaryErr: any) {
      console.warn("Primary model (gemini-3.5-flash) failed or high demand. Trying fallback gemini-3.1-flash-lite...", primaryErr);
      try {
        modelUsed = "gemini-3.1-flash-lite";
        fallbackUsed = true;
        const response = await client.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: { parts },
          config: {
            systemInstruction,
            temperature: 0.15,
          },
        });
        analysis = response.text;
      } catch (fallbackErr: any) {
        console.error("Fallback model (gemini-3.1-flash-lite) also failed:", fallbackErr);
        throw new Error(`Evaluation engine failed. Primary model error: ${primaryErr.message || primaryErr}. Fallback model error: ${fallbackErr.message || fallbackErr}`);
      }
    }

    res.json({ analysis, modelUsed, fallbackUsed });
  } catch (err: any) {
    console.error("AI Analysis Error:", err);
    res.status(500).json({ error: err.message || "An error occurred during score analysis." });
  }
});

// AI Chatbot Assistant Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, context } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing or invalid messages array." });
    }

    const client = getGeminiClient();

    // Map message history into standard format for @google/genai
    const formattedContents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    let contextPreamble = "";
    if (context) {
      if (context.sheetName) {
        contextPreamble += `Current Sheet Music: "${context.sheetName}". `;
      }
      if (context.difficulty) {
        contextPreamble += `User Skill Level: ${context.difficulty}. `;
      }
      if (context.hasAnalysis) {
        contextPreamble += `The user has generated an AI Diagnostic Report for this piece. `;
      }
    }

    const systemInstruction = `You are TempoSight Maestro AI, a helpful, encouraging, and highly knowledgeable piano tutor and sheet music AI assistant.
You are embedded in TempoSight, an AI-powered optical sheet music scanner and sight-reading diagnostic tool.
${contextPreamble ? `CURRENT CONTEXT: ${contextPreamble}` : ""}

YOUR GOALS:
- Answer questions about sheet music, notes, rhythms, key signatures, time signatures, fingerings, and music theory.
- Provide practice strategies, sight-reading tips, and hand coordination advice.
- Explain TempoSight diagnostic feedback if asked.
- Keep responses concise, supportive, and formatted cleanly. Use clear section headers and bullet points. Avoid raw hashtag symbols (# or ###) in headers; use numbered titles or bold headings instead.
- If asked unrelated questions, politely steer the conversation back to music, piano practice, and sheet music.`;

    let reply = "";
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      reply = response.text || "I couldn't generate a response. Please try again.";
    } catch (primaryErr: any) {
      console.warn("Chat primary model failed, trying gemini-3.1-flash-lite...", primaryErr);
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });
      reply = response.text || "I couldn't generate a response. Please try again.";
    }

    res.json({ reply });
  } catch (err: any) {
    console.error("AI Chat Error:", err);
    res.status(500).json({ error: err.message || "Failed to process chat request." });
  }
});

// Setup Vite Dev server or Serve static files
async function boostServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TempoSight Server running on http://0.0.0.0:${PORT}`);
  });
}

boostServer().catch((err) => {
  console.error("Failed to start server:", err);
});
