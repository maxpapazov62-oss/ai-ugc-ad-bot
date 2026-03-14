export const SORA_PROMPTING_GUIDE = `
# Sora 2 Video Prompt Guide

## Core Principles
- Sora 2 generates 15-second video clips by default
- For 30-second videos, create two sequential 15-second shots
- Each prompt should describe a complete, coherent visual scene
- Reference "the product shown in the reference image" when a product image is provided as start frame

## Prompt Structure
A strong Sora prompt has these components:
1. **Shot type**: Close-up, wide shot, medium shot, POV, etc.
2. **Subject**: Who or what is the focus (person, product, environment)
3. **Action/Motion**: What is happening, how things move
4. **Environment**: Setting, background, lighting conditions
5. **Mood/Tone**: Emotional quality, color palette, atmosphere
6. **Camera movement**: Pan, zoom, static, handheld, etc.

## For UGC-Style Ads
- Use handheld/shaky camera for authentic feel
- Natural lighting preferred (window light, outdoor)
- Real people in relatable settings (kitchen, bathroom, office, outdoors)
- Product should be held, used, or prominently featured
- Avoid overly polished/commercial aesthetics

## 15-Second Prompt Template
"[Shot type] of [subject] [action] in [environment]. [Camera movement]. [Lighting]. [Mood/tone]. The video feels [authentic/cinematic/documentary]. [Specific visual detail]."

## 30-Second Structure (2 x 15s shots)
**Shot 1 (Hook/Setup)**: Establish the problem or intrigue. Hook the viewer.
**Shot 2 (Resolution/CTA)**: Show the solution, transformation, or call to action.

## Proven UGC Hook Structures
1. **Problem reveal**: Person frustrated, then discovers product
2. **Before/after transformation**: Side-by-side or sequential comparison
3. **Testimonial moment**: Person speaking directly to camera, genuine expression
4. **Social proof**: Multiple people using the product in different scenarios
5. **Curiosity gap**: Something unexpected or surprising that makes viewer want to know more

## Technical Notes
- Sora handles human faces and motion well at 15s
- Complex multi-person scenes work better in 15s clips
- Product close-ups with motion (pouring, applying, using) look premium
- Natural color grading > heavy filters
- Audio is separate — prompts don't need to describe sound

## Example Prompts

### 15s Example — Skincare product
"Medium close-up of a woman in her early 30s in a bright bathroom, gently applying a serum from a small glass bottle to her face. She looks in the mirror with a satisfied expression. Soft natural window light from the left. Handheld camera, slightly shaky. Warm tones, minimal color grading. Authentic, UGC feel."

### 30s Shot 1 — Supplement product
"Close-up of tired hands typing on a laptop late at night. The person rubs their eyes and sighs. Dark home office setting, only screen light illuminating the scene. Handheld camera. Moody, fatigued atmosphere."

### 30s Shot 2 — Supplement product
"Same person, now energized, typing quickly and smiling. Morning light streams through the window. A supplement bottle sits next to a glass of water on the desk. Medium shot. Bright, warm, optimistic mood. The product shown in the reference image is clearly visible."
`;
