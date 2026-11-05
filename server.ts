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
    const { 
      image, 
      mimeType, 
      audio, 
      audioMimeType, 
      difficulty = "beginner", 
      pieceTitle = "", 
      composer = "", 
      genre = "",
      expectedKey = ""
    } = req.body;
    if (!image || !mimeType) {
      return res.status(400).json({ error: "Missing image payload or mimeType." });
    }

    // Helper to safely extract base64 data by removing any leading data URL headers or fetching remote URLs
    const resolveBase64 = async (inputStr: string): Promise<string> => {
      if (!inputStr) return "";
      let targetUrl = inputStr;
      if (targetUrl.includes("github.com") && targetUrl.includes("/blob/")) {
        targetUrl = targetUrl.replace("https://github.com/", "https://raw.githubusercontent.com/").replace("/blob/", "/");
      }
      if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
        try {
          const fetchRes = await fetch(targetUrl);
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
      ? `Listen intently to the uploaded audio clip note-by-note and compare every pitch, note, and rhythm directly back to the provided sheet music score segment${pieceTitle ? ` for "${pieceTitle}"` : ""}${expectedKey ? ` (Score Key: ${expectedKey})` : ""}.
CONDUCT AN ATTENTIVE NOTE-LEVEL PITCH AND ACCURACY AUDIT:
- Listen measure-by-measure for any wrong notes, flubbed pitches, missed notes, or incorrect chord tones played compared to the sheet music score. If any note was played wrong, explicitly pinpoint the measure number and the exact note mistake!
- Apply our genre-adapted evaluation standards (incorporating less strict tempo and fluency flexibility for pop songs/ballads like "Until I Found You", while maintaining stylistic metric balance for classical repertoire).
- Confirm key tonality adherence based on the visual score, but do NOT overlook individual note mistakes or wrong pitches.`
      : `Perform active sheet music diagnostics${pieceTitle ? ` for "${pieceTitle}"` : ""}${expectedKey ? ` (Score Key: ${expectedKey})` : ""} including key signature, main chord progressions with root chords and harmonic functions (e.g. I-IV-V, ii-V-I), technical trap doors, and practice instructions based strictly on the specified format guidelines for both classical and pop piano styles.`;

    parts.push({ text: userPrompt });

    const systemInstruction = `You are a precise, professional AI piano practice utility. The current user is performing at the **${difficulty.toUpperCase()}** difficulty level (Default is Beginner).
You must adjust your feedback, critique rigidity, precision standards, and vocabulary matching to this selected difficulty. Beginners should receive encouraging, readable, instructive explanations focusing on fundamental note layouts and simple subdivisions; intermediate players should receive a balance of accuracy, flow, and phrasing; advanced players should receive professional-tier, uncompromisingly precise feedback on micro-timing, hand articulation, physical geography, and advanced dynamic expression.

GENRE & REPERTOIRE ADAPTATION (CLASSICAL AND POP SONGS):
TempoSight is designed for BOTH Classical repertoire (e.g., Beethoven, Bach, Mozart, Chopin) AND Pop / Contemporary songs and ballads (e.g., Stephen Sanchez's "Until I Found You", modern pop piano arrangements, doo-wop ballads, contemporary lead sheets).
${pieceTitle ? `Target Piece / Uploaded Title: "${pieceTitle}"${composer ? ` by ${composer}` : ""}${genre ? ` [Genre: ${genre}]` : ""}.` : ""}
${expectedKey ? `Target Key Signature Ground Truth: ${expectedKey}.` : ""}

CRITICAL AUDIT: NOTE-LEVEL PITCH ACCURACY & WRONG NOTE DETECTION:
You must perform an attentive, meticulous note-by-note audit comparing the pitches heard in the performance against the written notes on the sheet music staff.
1. **ACTIVELY IDENTIFY WRONG NOTES & PITCH MISTAKES**:
   - If the player hits a wrong note, plays an incorrect pitch, flubs a note, hits an adjacent key, plays a wrong chord tone, or misses a note in the melody or accompaniment, YOU MUST DETECT AND REPORT IT!
   - Clearly state the **measure number** and the **exact note mistake** (e.g., "Wrong note in Measure 3: heard G4 played instead of the written E4", "In bar 2, beat 3, played D instead of F#", "Measure 5 melody pitch was flubbed: played C5 instead of B4").
2. **PENALIZE ACCURACY FOR NOTE MISTAKES**:
   - Do NOT award a generic high score for Accuracy if the player made a note mistake!
   - If there is an obvious wrong note or pitch error, deduct points from **Accuracy** (e.g., 4/10 to 6/10 for obvious note mistakes, 2/10 to 4/10 for multiple wrong notes).
   - Reflect the note error in the **Expert Rating** diagnostic summary sentence (e.g., "**wrong note in m. 3**", "**pitch mistake on beat 2**").
3. **DIFFERENCE BETWEEN KEY TONALITY AND NOTE MISTAKES**:
   - Key Signature tonality (in 'Key & Accidental') evaluates overall key observance.
   - **Accuracy** specifically audits individual note correctness, wrong pitches, and rhythm subdivisions. Never overlook or excuse wrong notes—point out the mistake constructively so the user knows what to practice!

CRITICAL GROUNDING FOR KEY SIGNATURE (AVOID FALSE ACCIDENTAL OR KEY ERRORS):
1. **THE SHEET MUSIC IS THE AUTHORITATIVE VISUAL GROUND TRUTH**:
   The score's key signature (identified visually in '# The Musical Blueprint'${expectedKey ? ` or established as "${expectedKey}"` : ""}) is the definitive key.
2. **DO NOT FALSELY CLAIM WRONG KEY SIGNATURE**:
   Users record real acoustic pianos or electronic keyboards using built-in laptop, tablet, or phone microphones. Audio compression, room resonance, and acoustic piano overtones frequently create prominent harmonic overtones.
   - If the user plays the notes of the piece in the proper key, award top marks (9-10/10) for **Key & Accidental**.
   - Only flag a key signature issue if the performer unmistakably transposed the entire piece into a completely different key.

CRITICAL GUIDELINES FOR POP SONGS & CONTEMPORARY BALLADS (e.g., "Until I Found You", romantic pop ballads, pop song arrangements):
1. **CHECK TEMPO AND FLUENCY LESS STRICTLY**: Pop songs and ballads naturally prioritize emotional resonance, natural vocal phrasing, rolled piano chords, arpeggiated compound meter accompaniments (like 12/8 doo-wop ballad rhythm), and expressive tempo elasticity (rubato) rather than strict metronomic rigidity.
2. **DO NOT PENALIZE NATURAL BALLAD RUBATO AS MISTAKES**: Do NOT penalize natural breath pauses at phrase breaks, arpeggiated chord rolls, or expressive ballad tempo elasticity as "hesitation", "stumbling", "dragging", or "unsteady tempo". Award generous, encouraging ratings (typically 8–10/10) for fluency and tempo when the performance captures the natural flow, emotional contour, and harmonic changes of the song.
3. Focus feedback constructively on smooth chord transitions, voicing, and emotional delivery.

CRITICAL GUIDELINES FOR CLASSICAL REPERTOIRE (e.g., Beethoven's Ode to Joy, Bach Minuet in G):
1. Evaluate classical pieces with appropriate metric pulse consistency, but balance strictness according to the user's selected difficulty level (${difficulty.toUpperCase()}).
2. For Beginner difficulty, be supportive and forgiving on tempo fluctuations, while clearly highlighting wrong notes so the beginner can correct them.

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
* **Expert Rating**: [Provide an objective numerical score out of 100 combined with a performance tier label, in the exact format: 'Score/100 (Tier Name)'. For example, '72/100 (Wrong Note in m. 3)' or '88/100 (Fluent Phrasing)'. If note mistakes occurred, clearly state them in the tier label and diagnostic summary. Always make sure this rating format is strictly adhered to, followed by a brief 1-sentence diagnostic rationale with key performance keywords bolded using markdown, e.g. **wrong note in m. 3**, **steady tempo**, **accurate rhythm**, **hesitation in m. 4**.]
* **Fluency**: [Rating out of 10 in format 'X/10', e.g. 9/10] - [Assess musical flow and continuity. IMPORTANT: For pop songs and ballads like 'Until I Found You', evaluate fluency less strictly, welcoming natural phrase pauses, rolled chords, and expressive rubato without penalizing them as hesitations or stumbles.]
* **Tempo**: [Rating out of 10 in format 'X/10', e.g. 9/10] - [Assess pulse stability and metric feel. IMPORTANT: For pop songs and ballads like 'Until I Found You', evaluate tempo less strictly, allowing expressive ballad elasticity, breathing room, and dynamic phrasing without penalizing it as dragging or rushing.]
* **Key & Accidental**: [Rating out of 10 in format 'X/10', e.g. 10/10] - [Affirm that the player accurately observed the score's key signature and accidentals. Confirm that the key tonality matches the sheet music score${expectedKey ? ` in ${expectedKey}` : ""}. Do NOT falsely report that the key signature was wrong when the user played the notes on the score.]
* **Accuracy**: [Rating out of 10 in format 'X/10', e.g. 5/10 if note mistakes occurred, 9/10 if all pitches were accurate] - [Detail any wrong notes, pitch errors, missed notes, or rhythmic deviations compared directly back to the visual score. YOU MUST explicitly specify the measure number(s) and the exact note mistake(s) (e.g., 'Wrong note in Measure 3: played G4 instead of written E4 in the melody') so the player knows exactly what note was missed or played incorrectly.]
* **Actionable Correction**: [Provide direct, targeted advice for each detected note mistake or rhythmic error, detailing how to slow down, count subdivisions, isolate the specific bar(s) with wrong notes, and correct finger placement.]` : ""}

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
- Provide practice strategies, sight-reading tips, and hand coordination advice for both classical pieces and contemporary pop songs.
- Understand that TempoSight evaluates both Classical repertoire and Pop songs (like "Until I Found You"), applying less strict tempo and fluency criteria to pop songs to accommodate natural ballad rubato and emotional phrasing.
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
