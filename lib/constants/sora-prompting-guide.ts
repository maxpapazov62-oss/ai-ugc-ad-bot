export const SORA_PROMPTING_GUIDE = `
# Sora 2 Video Prompt Guide — UGC Ad Framework

## Core Principles
- Sora 2 generates video clips up to 20 seconds
- For 30-second ads, create two sequential scenes (Scene 1: hook/problem, Scene 2: payoff/CTA)
- Every prompt must be long, highly specific, and cinematically detailed
- Vague prompts produce generic output — the more specific, the better
- Reference "the product shown in the reference image" when describing the product

---

## Required Prompt Structure (per scene)

### 1. Scene Header
Label the scene with a name and timestamp range:
SCENE 1 — "Scene Name" (0:00–0:15)

### 2. API Parameters
model: sora-2 | size: 720x1280 | seconds: [12–20]

### 3. Style Block
One short paragraph describing:
- Camera style (handheld UGC, cinematic, POV, etc.)
- Setting and location
- Lighting quality and time of day
- Overall aesthetic and emotional feel
- What it should NOT look like (no studio lighting, no polished commercial feel, etc.)

### 4. Subject Description
Detailed visual description of the person:
- Age range, hair color and length, skin tone, eye color, complexion
- Outfit (specific colors, fabrics, fit)
- Physical state (flushed, energized, tired, glowing, etc.)
- What they are holding, touching, or interacting with
- Their expression, body language, energy level
- Exact product details if visible: label text, color, logo, packaging

### 5. Cinematography Block
- Camera shot: framing (e.g. "handheld selfie POV, medium close-up from chest to crown")
- Depth of field: what is sharp vs. blurred
- Lighting + palette: specific light source, direction, color anchors in the frame
- Mood: one or two evocative sentences describing the emotional quality of the shot

### 6. Action / Motion Sequence
Bullet-point the exact sequence of movements:
- What the subject does first, second, third
- Micro-gestures (eyebrow raises, leaning forward, tapping the product, laughing)
- Camera movement if any (slow push-in, slight drift left, etc.)

### 7. Dialogue
Scripted lines exactly as they should be spoken, with tone notes:
- [Character name or descriptor] (tone/action): "Exact words spoken."

### 8. Background Sound
Describe the ambient audio (NOT music unless specified):
- Environmental sounds (wind, birds, crowd, traffic)
- Character audio qualities (breathless, warm, whispering, excited)
- Any product sounds (pour, fizz, click)

---

## UGC Hook Archetypes

1. **Post-Activity Revelation** — person just finished working out, cooking, etc., discovers or uses product in the moment
2. **Direct-to-Camera Testimonial** — honest, slightly breathless confession style; feels like texting a friend a voice memo
3. **Before/After Problem-Solution** — Scene 1 shows the struggle; Scene 2 shows the transformation
4. **Curiosity Gap** — opens on something unexpected, odd, or visually surprising that makes the viewer stop scrolling
5. **Social Proof Montage** — quick cuts of different people in different real settings all using the same product

---

## What Makes a Prompt Great
- Physical specificity: "warm olive skin, hazel-brown eyes, cheeks flushed pink" beats "a woman"
- Product specificity: describe color, label text, logo, packaging shape — as if painting it
- Lighting specificity: "golden late-afternoon sunlight from above and left, soft bounce from surrounding greenery" beats "good lighting"
- Motion specificity: "taps the pouch firmly with one finger, eyebrows raised, leaning slightly forward into lens" beats "holds up the product"
- Emotional specificity: describe the internal state driving the performance, not just the action

---

## Full Example — 15s UGC Scene

SCENE 1 — "Post-Run Revelation" (0:00–0:12)

API Parameters:
model: sora-2 | size: 720x1280 | seconds: 12

Style: Authentic UGC self-recording — handheld phone, front-facing camera, slightly above eye level. Outdoor park setting, golden late-afternoon sunlight. Lush green trees, colorful flower beds, bright blue sky visible behind her. Warm, vibrant, energetic feel — like a genuine TikTok filmed immediately after a run. Slightly breathless, flushed, real. No studio lighting.

Subject: A young woman in her early 20s with long dark brown hair, warm olive skin, hazel-brown eyes, and a natural fresh-faced complexion. She wears a fitted dark grey long-sleeve athletic top. Her cheeks are flushed pink with exertion, a light sheen of sweat visible on her forehead and temples. She is breathing slightly heavily — visibly post-workout. She holds her phone at arm's length recording herself. In her free hand she holds a pink electrolyte drink pouch with bold white logo text, label facing toward the camera. Her energy is high and infectious despite being out of breath — wide grin, animated eyes, genuine excitement.

Cinematography:
Camera shot: handheld selfie POV, front-facing, medium close-up from chest to crown, slight upward tilt
Depth of field: shallow — woman and product sharp in foreground, park greenery and flowers warmly blurred behind
Lighting + palette: warm golden late-afternoon sunlight from above and left, soft bounce from surrounding greenery. Color anchors: vibrant green trees, bright blue sky, hot pink pouch, dark grey athletic wear, warm golden skin glow
Mood: breathless, glowing, real — the authentic energy of someone mid-recovery who genuinely can't stop talking about what they're holding

Motion sequence:
- She fans her face with her free hand briefly, laughing — visibly just finished running — then snaps gaze directly to camera
- Raises the product pouch into frame beside her face with a triumphant arm, label toward camera
- Taps the pouch firmly with one finger, eyebrows raised, leaning slightly forward into lens

Dialogue:
- Girl (fanning face, laughing breathlessly): "Okay I literally just finished a five mile run and I am DONE — but watch this."
- Girl (raises pouch into frame, eyes wide): "This is [Product]. And it hydrates you faster than water alone. Scientifically proven."
- Girl (tapping pouch, leaning in): "Four times the electrolytes of a regular sports drink. No added sugar. No junk. Just actual hydration that works."

Background sound: Outdoor park ambience — light breeze through trees, distant birdsong, faint sound of her catching breath. Voice slightly breathless but warm to the mic. No music.

---

## Full Example — 30s (2 scenes)

SCENE 1 — "The Struggle" (0:00–0:15)
[hook scene showing the problem]

SCENE 2 — "The Fix" (0:15–0:30)
[resolution scene showing the product as the solution with CTA]

Each scene follows the same full structure above.
`;
