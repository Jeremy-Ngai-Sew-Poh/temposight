// Sample Sheet Music & Audio Recordings for instant evaluation testing

export type SampleIconType = "double-note" | "single-note" | "heart" | "music4" | "disc";

export interface SamplePieceTheme {
  iconType: SampleIconType;
  iconBg: string;
  iconBorder: string;
  iconText: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export interface SamplePiece {
  id: string;
  title: string;
  composer: string;
  subtitle: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  key: string;
  meter: string;
  description: string;
  imageUrl: string;
  audioUrl: string;
  imageFileName: string;
  audioFileName: string;
  imageMimeType: string;
  audioMimeType: string;
  duration?: string;
  features: string[];
  theme?: SamplePieceTheme;
}

export const SAMPLE_PIECES: SamplePiece[] = [
  {
    id: "ode_to_joy_intro",
    title: "Ode to Joy (Intro)",
    composer: "Ludwig van Beethoven",
    subtitle: "Symphony No. 9 in D Minor, Op. 125",
    difficulty: "Beginner",
    key: "D Major",
    meter: "4/4",
    description: "The universally recognized opening theme of Beethoven's Ode to Joy. Features clear stepwise melodic motion with quarter notes and half notes, making it an ideal benchmark for optical notation scanning and rhythmic audio performance analysis.",
    imageUrl: "https://files.catbox.moe/h0v1nm.png",
    audioUrl: "https://files.catbox.moe/sfq784.wav",
    imageFileName: "Ode to Joy (Intro) - Beethoven.png",
    audioFileName: "ode_to_joy_intro_sample.wav",
    imageMimeType: "image/png",
    audioMimeType: "audio/wav",
    duration: "0:15",
    features: [
      "Stepwise melodic contour",
      "Standard 4/4 meter & steady quarter notes",
      "Synchronized acoustic piano performance clip",
    ],
    theme: {
      iconType: "single-note",
      iconBg: "bg-emerald-50/80",
      iconBorder: "border-emerald-200/70",
      iconText: "text-emerald-800",
      badgeBg: "bg-emerald-100/70",
      badgeText: "text-emerald-900",
      badgeBorder: "border-emerald-300/60",
    },
  },
  {
    id: "minuet_in_g_major",
    title: "Minuet in G Major",
    composer: "Christian Petzold / J.S. Bach",
    subtitle: "Notebook for Anna Magdalena Bach, BWV Anh. 114",
    difficulty: "Beginner",
    key: "G Major",
    meter: "3/4",
    description: "The classic Baroque dance piece in 3/4 meter from the 1725 Notebook for Anna Magdalena Bach. Features lyrical stepwise eighth-note turns and balanced phrasing over a steady bassline, perfect for optical key signature verification and rhythmic timing analysis.",
    imageUrl: "https://files.catbox.moe/e7eq1o.png",
    audioUrl: "https://files.catbox.moe/992cks.wav",
    imageFileName: "Minuet in G Major - Petzold_Bach.png",
    audioFileName: "minuet_in_g_major_sample.wav",
    imageMimeType: "image/png",
    audioMimeType: "audio/wav",
    duration: "0:24",
    features: [
      "Baroque 3/4 minuet dance pulse",
      "Right-hand stepwise eighth-note melodic figures",
      "G Major key signature (F#) & phrasing evaluation",
    ],
    theme: {
      iconType: "double-note",
      iconBg: "bg-sky-50/90",
      iconBorder: "border-sky-200/80",
      iconText: "text-sky-700",
      badgeBg: "bg-emerald-100/70",
      badgeText: "text-emerald-900",
      badgeBorder: "border-emerald-300/60",
    },
  },
  {
    id: "until_i_found_you",
    title: "Until I Found You",
    composer: "Stephen Sanchez",
    subtitle: "Arranged for Piano / 1950s Doo-Wop Ballad",
    difficulty: "Beginner",
    key: "Bb Major",
    meter: "12/8",
    description: "Stephen Sanchez's breakout romantic ballad in classic 1950s doo-wop style. Features warm arpeggiated piano chords, expressive compound meter rhythms, and soulful melodic contours.",
    imageUrl: "https://files.catbox.moe/i05tvh.jpg",
    audioUrl: "https://files.catbox.moe/wjybmh.wav",
    imageFileName: "Until I Found You - Stephen Sanchez.jpg",
    audioFileName: "until_i_found_you_sample.wav",
    imageMimeType: "image/jpeg",
    audioMimeType: "audio/wav",
    duration: "1:12",
    features: [
      "Classic 12/8 compound ballad rhythm",
      "Arpeggiated left-hand chord progression",
      "Expressive rubato and dynamic vocal contour",
    ],
    theme: {
      iconType: "heart",
      iconBg: "bg-purple-50/90",
      iconBorder: "border-purple-200/80",
      iconText: "text-purple-700",
      badgeBg: "bg-emerald-100/70",
      badgeText: "text-emerald-900",
      badgeBorder: "border-emerald-300/60",
    },
  },
];

// Preloaded Image & Audio cache objects to eliminate network rendering latency
const preloadedImages: HTMLImageElement[] = [];
const preloadedAudios: HTMLAudioElement[] = [];

/**
 * Preload all sample sheet music images and audio recordings immediately into browser memory
 * so they appear instantly without delay or blank flicker upon user selection.
 */
export function preloadSampleAssets(): void {
  if (typeof window === "undefined") return;

  SAMPLE_PIECES.forEach((sample) => {
    // 1. Preload & decode sheet music notation image
    try {
      const img = new Image();
      img.src = sample.imageUrl;
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      if ("decode" in img) {
        img.decode().catch(() => {
          // Silently handle if decode completes or fails gracefully
        });
      }
      preloadedImages.push(img);
    } catch (e) {
      console.warn("Image preload error for", sample.title, e);
    }

    // 2. Pre-fetch and buffer sample practice audio
    try {
      const audio = new Audio();
      audio.preload = "auto";
      audio.src = sample.audioUrl;
      preloadedAudios.push(audio);
    } catch (e) {
      console.warn("Audio preload error for", sample.title, e);
    }
  });
}

// Automatically trigger eager preloading as soon as module is evaluated in the client
if (typeof window !== "undefined") {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    preloadSampleAssets();
  } else {
    window.addEventListener("DOMContentLoaded", preloadSampleAssets, { once: true });
  }
}
