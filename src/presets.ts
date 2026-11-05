// SVG sheet music presets for Chopin, Bach, and Beethoven.
// These are clean, scalable vector representations of piano score segments.

export interface ScorePreset {
  id: string;
  title: string;
  composer: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  key: string;
  meter: string;
  description: string;
  svgContent: string;
}

export const PRESETS: ScorePreset[] = [
  {
    id: "bach_prelude",
    title: "Prelude in C Major (BWV 846)",
    composer: "Johann Sebastian Bach",
    difficulty: "Beginner",
    key: "C Major",
    meter: "4/4",
    description: "The classic opening prelude from The Well-Tempered Clavier. Features continuous block-like broken-chord arpeggios that demand highly even finger weight.",
    svgContent: `<svg viewBox="0 0 600 240" fill="currentColor" class="w-full h-full text-zinc-800 dark:text-zinc-200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent"/>
      <!-- Grand Staff Brace -->
      <path d="M 30,30 L 30,210 M 24,30 C 24,30 28,40 28,50 L 28,190 C 28,200 24,210 24,210 M 30,30 C 30,30 35,32 35,35" stroke="currentColor" stroke-width="2.5" fill="none"/>
      
      <!-- Treble Staff -->
      <line x1="30" y1="50" x2="570" y2="50" stroke="currentColor" stroke-width="1.5"/>
      <line x1="30" y1="62" x2="570" y2="62" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="74" x2="570" y2="74" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="86" x2="570" y2="86" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="98" x2="570" y2="98" stroke="currentColor" stroke-width="1.5"/>
      
      <!-- Bass Staff -->
      <line x1="30" y1="142" x2="570" y2="142" stroke="currentColor" stroke-width="1.5"/>
      <line x1="30" y1="154" x2="570" y2="154" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="166" x2="570" y2="166" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="178" x2="570" y2="178" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="190" x2="570" y2="190" stroke="currentColor" stroke-width="1.5"/>

      <!-- Bar Lines -->
      <line x1="30" y1="50" x2="30" y2="190" stroke="currentColor" stroke-width="2.5"/>
      <line x1="300" y1="50" x2="300" y2="98" stroke="currentColor" stroke-width="1.5"/>
      <line x1="300" y1="142" x2="300" y2="190" stroke="currentColor" stroke-width="1.5"/>
      <line x1="570" y1="50" x2="570" y2="190" stroke="currentColor" stroke-width="2.5"/>

      <!-- Treble Clef Symbol -->
      <path d="M 45,108 C 48,100 52,90 48,80 C 45,72 38,75 38,82 C 38,90 48,93 45,105 C 42,112 36,105 38,98" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M 45,105 L 45,40 C 45,35 48,32 50,35 C 52,38 48,48 44,55 L 44,115 C 44,120 40,122 40,118" stroke="currentColor" stroke-width="2" fill="none"/>
      
      <!-- Bass Clef Symbol -->
      <path d="M 40,154 C 40,146 50,142 50,154 C 50,166 40,172 40,172" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <circle cx="56" cy="150" r="1.5" fill="currentColor"/>
      <circle cx="56" cy="158" r="1.5" fill="currentColor"/>

      <!-- Time Signature (4/4) -->
      <text x="75" y="76" font-family="Times New Roman, serif" font-weight="bold" font-size="32" fill="currentColor" text-anchor="middle">4</text>
      <text x="75" y="100" font-family="Times New Roman, serif" font-weight="bold" font-size="32" fill="currentColor" text-anchor="middle">4</text>
      <text x="75" y="168" font-family="Times New Roman, serif" font-weight="bold" font-size="32" fill="currentColor" text-anchor="middle">4</text>
      <text x="75" y="192" font-family="Times New Roman, serif" font-weight="bold" font-size="32" fill="currentColor" text-anchor="middle">4</text>

      <!-- Notes Measure 1 (C Major broken chords) -->
      <!-- Bass: C3 (ledger line below staff) and E3 -->
      <circle cx="110" cy="202" r="5" fill="currentColor" transform="rotate(-20 110 202)"/>
      <line x1="98" y1="202" x2="122" y2="202" stroke="currentColor" stroke-width="1"/>
      <circle cx="130" cy="178" r="5" fill="currentColor" transform="rotate(-20 130 178)"/>
      <path d="M 115,202 L 115,160 M 135,178 L 135,136" stroke="currentColor" stroke-width="1.2"/>
      <!-- Treble: G3, C4, E4 sixteenth notes -->
      <circle cx="160" cy="98" r="5" fill="currentColor"/>
      <circle cx="180" cy="86" r="5" fill="currentColor"/>
      <circle cx="200" cy="74" r="5" fill="currentColor"/>
      <circle cx="220" cy="86" r="5" fill="currentColor"/>
      <circle cx="240" cy="74" r="5" fill="currentColor"/>
      <!-- Beams and stems for sixteenth notes -->
      <path d="M 165,98 L 165,60 M 185,86 L 185,60 M 205,74 L 205,60 M 225,86 L 225,60 M 245,74 L 245,60" stroke="currentColor" stroke-width="1"/>
      <line x1="165" y1="60" x2="245" y2="60" stroke="currentColor" stroke-width="4"/>
      <line x1="165" y1="66" x2="245" y2="66" stroke="currentColor" stroke-width="1.5"/>

      <!-- Notes Measure 2 (D minor broken chords / shifting harmony) -->
      <!-- Bass: C3 and D3 -->
      <circle cx="340" cy="202" r="5" fill="currentColor" transform="rotate(-20 340 202)"/>
      <line x1="328" y1="202" x2="352" y2="202" stroke="currentColor" stroke-width="1"/>
      <circle cx="360" cy="190" r="5" fill="currentColor"/>
      <path d="M 345,202 L 345,160 M 365,190 L 365,148" stroke="currentColor" stroke-width="1.2"/>
      <!-- Treble: A3, D4, F4 sixteenth notes -->
      <circle cx="390" cy="92" r="5" fill="currentColor"/>
      <circle cx="410" cy="80" r="5" fill="currentColor"/>
      <circle cx="430" cy="68" r="5" fill="currentColor"/>
      <circle cx="450" cy="80" r="5" fill="currentColor"/>
      <circle cx="470" cy="68" r="5" fill="currentColor"/>
      <!-- Beams and stems -->
      <path d="M 395,92 L 395,55 M 415,80 L 415,55 M 435,68 L 435,55 M 455,80 L 455,55 M 475,68 L 475,55" stroke="currentColor" stroke-width="1"/>
      <line x1="395" y1="55" x2="475" y2="55" stroke="currentColor" stroke-width="4"/>
      <line x1="395" y1="61" x2="475" y2="61" stroke="currentColor" stroke-width="1.5"/>
    </svg>`
  },
  {
    id: "beethoven_moonlight",
    title: "Moonlight Sonata (Op. 27 No. 2, Mvt. 1)",
    composer: "Ludwig van Beethoven",
    difficulty: "Intermediate",
    key: "C# Minor",
    meter: "2/2 (Cut Time)",
    description: "Conceived as an improvisation. The relentless triplet ostinato requires flawless rhythmic stability against long sustained bass octaves.",
    svgContent: `<svg viewBox="0 0 600 240" fill="currentColor" class="w-full h-full text-zinc-800 dark:text-zinc-200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent"/>
      <!-- Grand Staff Brace -->
      <path d="M 30,30 L 30,210 M 24,30 C 24,30 28,40 28,50 L 28,190 C 28,200 24,210 24,210 M 30,30 C 30,30 35,32 35,35" stroke="currentColor" stroke-width="2.5" fill="none"/>
      
      <!-- Treble Staff -->
      <line x1="30" y1="50" x2="570" y2="50" stroke="currentColor" stroke-width="1.5"/>
      <line x1="30" y1="62" x2="570" y2="62" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="74" x2="570" y2="74" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="86" x2="570" y2="86" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="98" x2="570" y2="98" stroke="currentColor" stroke-width="1.5"/>
      
      <!-- Bass Staff -->
      <line x1="30" y1="142" x2="570" y2="142" stroke="currentColor" stroke-width="1.5"/>
      <line x1="30" y1="154" x2="570" y2="154" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="166" x2="570" y2="166" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="178" x2="570" y2="178" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="190" x2="570" y2="190" stroke="currentColor" stroke-width="1.5"/>

      <!-- Bar Lines -->
      <line x1="30" y1="50" x2="30" y2="190" stroke="currentColor" stroke-width="2.5"/>
      <line x1="300" y1="50" x2="300" y2="190" stroke="currentColor" stroke-width="1.5"/>
      <line x1="570" y1="50" x2="570" y2="190" stroke="currentColor" stroke-width="2.5"/>

      <!-- Treble Clef -->
      <path d="M 45,108 C 48,100 52,90 48,80 C 45,72 38,75 38,82 C 38,90 48,93 45,105 C 42,112 36,105 38,98" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M 45,105 L 45,40 C 45,35 48,32 50,35 C 52,38 48,48 44,55 L 44,115 C 44,120 40,122 40,118" stroke="currentColor" stroke-width="2" fill="none"/>
      
      <!-- Bass Clef -->
      <path d="M 40,154 C 40,146 50,142 50,154 C 50,166 40,172 40,172" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <circle cx="56" cy="150" r="1.5" fill="currentColor"/>
      <circle cx="56" cy="158" r="1.5" fill="currentColor"/>

      <!-- Key Signature: C# Minor (4 sharp symbols: F#, C#, G#, D#) -->
      <!-- Treble sharps -->
      <text x="65" y="58" font-family="Arial" font-size="16" font-weight="bold" fill="currentColor">#</text>
      <text x="73" y="73" font-family="Arial" font-size="16" font-weight="bold" fill="currentColor">#</text>
      <text x="81" y="54" font-family="Arial" font-size="16" font-weight="bold" fill="currentColor">#</text>
      <text x="89" y="66" font-family="Arial" font-size="16" font-weight="bold" fill="currentColor">#</text>

      <!-- Bass sharps -->
      <text x="65" y="150" font-family="Arial" font-size="16" font-weight="bold" fill="currentColor">#</text>
      <text x="73" y="165" font-family="Arial" font-size="16" font-weight="bold" fill="currentColor">#</text>
      <text x="81" y="146" font-family="Arial" font-size="16" font-weight="bold" fill="currentColor">#</text>
      <text x="89" y="158" font-family="Arial" font-size="16" font-weight="bold" fill="currentColor">#</text>

      <!-- Time Signature (Cut Time 'C' with slash) -->
      <text x="110" y="80" font-family="Times New Roman, serif" font-weight="bold" font-size="34" fill="currentColor">¢</text>
      <text x="110" y="172" font-family="Times New Roman, serif" font-weight="bold" font-size="34" fill="currentColor">¢</text>

      <!-- Measure 1 Notes -->
      <!-- Bass: Octave C#2 - C#3 long notes -->
      <circle cx="150" cy="190" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <circle cx="150" cy="154" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <path d="M 144,190 L 144,170 M 156,154 L 156,174" stroke="currentColor" stroke-width="1"/>

      <!-- Treble: Right Hand continuous triplets (G4-C5-E5) -->
      <!-- One triplet group -->
      <circle cx="160" cy="86" r="4.5" fill="currentColor"/>
      <circle cx="180" cy="74" r="4.5" fill="currentColor"/>
      <circle cx="200" cy="62" r="4.5" fill="currentColor"/>
      <path d="M 164.5,86 L 164.5,50 M 184.5,74 L 184.5,50 M 204.5,62 L 204.5,50" stroke="currentColor" stroke-width="1"/>
      <line x1="164.5" y1="50" x2="204.5" y2="50" stroke="currentColor" stroke-width="3"/>
      <text x="182" y="44" font-family="Arial" font-size="11" fill="currentColor" text-anchor="middle">3</text>

      <!-- Second triplet group -->
      <circle cx="220" cy="86" r="4.5" fill="currentColor"/>
      <circle cx="240" cy="74" r="4.5" fill="currentColor"/>
      <circle cx="260" cy="62" r="4.5" fill="currentColor"/>
      <path d="M 224.5,86 L 224.5,50 M 244.5,74 L 244.5,50 M 264.5,62 L 264.5,50" stroke="currentColor" stroke-width="1"/>
      <line x1="224.5" y1="50" x2="264.5" y2="50" stroke="currentColor" stroke-width="3"/>
      <text x="242" y="44" font-family="Arial" font-size="11" fill="currentColor" text-anchor="middle">3</text>

      <!-- Measure 2 Notes (Treble continues, Bass shifts down to B1-B2) -->
      <circle cx="330" cy="178" r="6" stroke="currentColor" stroke-width="1.5" fill="none"/>
      <!-- Treble triplets -->
      <circle cx="340" cy="86" r="4.5" fill="currentColor"/>
      <circle cx="360" cy="74" r="4.5" fill="currentColor"/>
      <circle cx="380" cy="62" r="4.5" fill="currentColor"/>
      <path d="M 344.5,86 L 344.5,50 M 364.5,74 L 364.5,50 M 384.5,62 L 384.5,50" stroke="currentColor" stroke-width="1"/>
      <line x1="344.5" y1="50" x2="384.5" y2="50" stroke="currentColor" stroke-width="3"/>
      <text x="364" y="44" font-family="Arial" font-size="11" fill="currentColor" text-anchor="middle">3</text>

      <!-- Dotted melody note above -->
      <circle cx="450" cy="50" r="5" fill="currentColor"/>
      <path d="M 455,50 L 455,15" stroke="currentColor" stroke-width="1"/>
      <circle cx="462" cy="50" r="1.5" fill="currentColor"/>
    </svg>`
  },
  {
    id: "chopin_nocturne",
    title: "Nocturne in Eb Major (Op. 9 No. 2)",
    composer: "Frédéric Chopin",
    difficulty: "Advanced",
    key: "Eb Major",
    meter: "12/8",
    description: "The peak of romantic lyrical bel canto tone projection. Requires delicate left-hand wider extensions and smooth timing for highly ornamental right-hand melodies.",
    svgContent: `<svg viewBox="0 0 600 240" fill="currentColor" class="w-full h-full text-zinc-800 dark:text-zinc-200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent"/>
      <!-- Grand Staff Brace -->
      <path d="M 30,30 L 30,210 M 24,30 C 24,30 28,40 28,50 L 28,190 C 28,200 24,210 24,210 M 30,30 C 30,30 35,32 35,35" stroke="currentColor" stroke-width="2.5" fill="none"/>
      
      <!-- Treble Staff -->
      <line x1="30" y1="50" x2="570" y2="50" stroke="currentColor" stroke-width="1.5"/>
      <line x1="30" y1="62" x2="570" y2="62" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="74" x2="570" y2="74" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="86" x2="570" y2="86" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="98" x2="570" y2="98" stroke="currentColor" stroke-width="1.5"/>
      
      <!-- Bass Staff -->
      <line x1="30" y1="142" x2="570" y2="142" stroke="currentColor" stroke-width="1.5"/>
      <line x1="30" y1="154" x2="570" y2="154" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="166" x2="570" y2="166" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="178" x2="570" y2="178" stroke="currentColor" stroke-width="1"/>
      <line x1="30" y1="190" x2="570" y2="190" stroke="currentColor" stroke-width="1.5"/>

      <!-- Bar Lines -->
      <line x1="30" y1="50" x2="30" y2="190" stroke="currentColor" stroke-width="2.5"/>
      <line x1="300" y1="50" x2="300" y2="190" stroke="currentColor" stroke-width="1.5"/>
      <line x1="570" y1="50" x2="570" y2="190" stroke="currentColor" stroke-width="2.5"/>

      <!-- Treble Clef -->
      <path d="M 45,108 C 48,100 52,90 48,80 C 45,72 38,75 38,82 C 38,90 48,93 45,105 C 42,112 36,105 38,98" stroke="currentColor" stroke-width="2" fill="none"/>
      <path d="M 45,105 L 45,40 C 45,35 48,32 50,35 C 52,38 48,48 44,55 L 44,115 C 44,120 40,122 40,118" stroke="currentColor" stroke-width="2" fill="none"/>
      
      <!-- Bass Clef -->
      <path d="M 40,154 C 40,146 50,142 50,154 C 50,166 40,172 40,172" stroke="currentColor" stroke-width="2.5" fill="none"/>
      <circle cx="56" cy="150" r="1.5" fill="currentColor"/>
      <circle cx="56" cy="158" r="1.5" fill="currentColor"/>

      <!-- Key Signature: Eb Major (3 flat symbols: Bb, Eb, Ab) -->
      <!-- Treble flats -->
      <text x="65" y="76" font-family="Arial" font-size="18" fill="currentColor">b</text>
      <text x="73" y="60" font-family="Arial" font-size="18" fill="currentColor">b</text>
      <text x="81" y="80" font-family="Arial" font-size="18" fill="currentColor">b</text>

      <!-- Bass flats -->
      <text x="65" y="168" font-family="Arial" font-size="18" fill="currentColor">b</text>
      <text x="73" y="152" font-family="Arial" font-size="18" fill="currentColor">b</text>
      <text x="81" y="172" font-family="Arial" font-size="18" fill="currentColor">b</text>

      <!-- Time Signature (12/8) -->
      <text x="102" y="74" font-family="Times New Roman, serif" font-weight="bold" font-size="24" fill="currentColor" text-anchor="middle">12</text>
      <text x="102" y="96" font-family="Times New Roman, serif" font-weight="bold" font-size="24" fill="currentColor" text-anchor="middle">8</text>
      <text x="102" y="166" font-family="Times New Roman, serif" font-weight="bold" font-size="24" fill="currentColor" text-anchor="middle">12</text>
      <text x="102" y="188" font-family="Times New Roman, serif" font-weight="bold" font-size="24" fill="currentColor" text-anchor="middle">8</text>

      <!-- Left hand waltz accompaniment (Eb bass -> Bb chord -> G minor chord) -->
      <!-- Bass note Eb2 -->
      <circle cx="150" cy="178" r="5" fill="currentColor"/>
      <path d="M 154.5,178 L 154.5,145" stroke="currentColor" stroke-width="1"/>
      <circle cx="159" cy="178" r="1.5" fill="currentColor"/> <!-- dotted -->
      
      <!-- Chords Eb Major / G minor -->
      <circle cx="190" cy="154" r="5" fill="currentColor"/>
      <circle cx="190" cy="166" r="5" fill="currentColor"/>
      <circle cx="190" cy="178" r="5" fill="currentColor"/>
      <path d="M 194.5,154 L 194.5,125" stroke="currentColor" stroke-width="1"/>

      <!-- Right Hand elegant melody melody with dotted subdivisions -->
      <circle cx="150" cy="74" r="5" fill="currentColor"/>
      <path d="M 155,74 L 155,40" stroke="currentColor" stroke-width="1"/>
      <path d="M 155,40 C 160,45 165,42 165,48" stroke="currentColor" stroke-width="1" fill="none"/>
      
      <circle cx="210" cy="62" r="5" fill="currentColor"/>
      <path d="M 215,62 L 215,30 M 215,30 C 220,35 225,32 225,38" stroke="currentColor" stroke-width="1"/>
      <circle cx="218" cy="62" r="1.5" fill="currentColor"/>
    </svg>`
  }
];
