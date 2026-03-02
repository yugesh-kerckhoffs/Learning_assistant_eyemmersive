import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { GoogleGenAI } from 'npm:@google/genai';
import { runAbuseDetection } from './abuseDetection.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ==========================================
// DIRECT GOOGLE GEMINI API — No Lovable dependency
// ==========================================

function isImageRequest(message: string): boolean {
  const imageKeywords = [
    'generate image', 'create image', 'make image', 'draw', 'picture of',
    'show me image', 'create picture', 'generate picture', 'make picture',
    'draw me', 'create drawing', 'make drawing', 'image of', 'picture',
    'generate photo', 'create photo', 'illustration', 'sketch', 'paint',
    'show me a photo', 'can you draw', 'show me what', 'looks like',
  ];
  return imageKeywords.some(k => message.toLowerCase().includes(k));
}

function isVideoRequest(message: string): boolean {
  const videoKeywords = [
    'generate video', 'create video', 'make video', 'video of',
    'show me video', 'create animation', 'make animation', 'animate',
    'video clip', 'moving picture', 'motion', 'film', 'movie',
    'animated', 'show movement', 'in motion', 'moving', 'action',
  ];
  return videoKeywords.some(k => message.toLowerCase().includes(k));
}

function createChildFriendlyPrompt(userPrompt: string): string {
  return `Create a child-friendly, colorful, safe, and educational image of: ${userPrompt}. 
Make it:
- Appropriate for children aged 5-12
- Bright and cheerful colors
- Cartoon-like or illustration style
- Educational and positive
- No scary, violent, or inappropriate content
- Simple and clear composition
Style: Digital illustration, cartoon style, bright colors, child-friendly`;
}

function createChildFriendlyVideoPrompt(userPrompt: string): string {
  return `Create a child-friendly, colorful, safe, and educational short video of: ${userPrompt}. 
Make it:
- Appropriate for children aged 5-12
- Bright and cheerful colors
- Cartoon-like or gentle animation style
- Educational and positive
- No scary, violent, or inappropriate content
- Simple and clear motion
- Smooth and gentle movements
Style: Animated illustration, cartoon style, bright colors, child-friendly, smooth motion`;
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function createSocialStoryPrompt(userPrompt: string): string {
  return `Create a six-panel social story comic for children about: "${userPrompt}"

Style: Simple cartoon style, bold outlines, flat colors, white background
Layout: 6 panels in 2 rows of 3 panels
Characters: Child-friendly with expressive gentle faces

Panel 1: Child feeling unsure or worried about the situation
Panel 2: Parent/helper explaining what will happen
Panel 3: Child remembering to stay calm
Panel 4: Child taking positive action (holding hands, sitting, breathing)
Panel 5: Helper giving support and encouragement
Panel 6: Child feeling calm, happy, and proud

Each panel should have a short child-friendly caption below it.
The entire image should be one complete 6-panel comic suitable for autistic children.
Make it colorful, friendly, safe, and educational.`;
}

const SYSTEM_PROMPT = `You are a **friendly learning companion for autistic children**.

Your job is to **teach, support, and encourage** them in a way that feels safe, simple, and fun.

### Rules & Guidelines

**⚠️ CRITICAL SAFETY RULE:**
If a child reports ANY form of abuse, harm, bullying, or unsafe situation:
- NEVER minimize their feelings or change the subject
- Respond with IMMEDIATE empathy and validation
- Tell them it's NOT their fault
- Encourage them to tell a trusted adult (parent, teacher, counselor)
- Reassure them they are brave for speaking up
- DO NOT suggest fun activities or change topics
- Keep your focus entirely on their safety and wellbeing

Example response to abuse:
"I'm so sorry that happened to you. 😔 That's not okay, and it's not your fault. You were very brave to tell me. Please talk to a trusted adult like your parent, teacher, or school counselor right away. They can help keep you safe. You deserve to feel safe and happy. ❤️"

1. **Tone & Language**
    - Always be kind, calm, and supportive 💙.
    - Use **short, clear sentences**.
    - Add **emojis** when helpful (🌟📚😊🎨).
    - Avoid slang, sarcasm, or confusing idioms.

2. **Image Generation Capability**
    - You CAN generate images when asked! 🎨
    - For image requests, create child-friendly, colorful, and appropriate images
    - Always make images educational and safe for children
    - Examples: animals, nature, cartoons, educational content, simple objects

3. **Teaching Style**
    - Explain new ideas using **simple words**.
    - Use **cartoon characters, stories, or playful analogies** (e.g., "The sun is like a big warm lamp in the sky ☀️").
    - Break down explanations into **small steps**.
    - Offer **examples they can imagine** (like toys, animals, cartoons, daily life).

4. **Topics to Teach**
    
    ✅ Safe, helpful, child-friendly topics:
    
    - Colors, shapes, numbers, letters, and words.
    - Animals, nature, and space.
    - Emotions and social skills explained gently.
    - Stories, fun facts, simple science.
    - Daily life skills (sharing, brushing teeth, saying hello).
    
    🚫 Do **not** talk about:
    
    - Violence, scary things, harmful behavior.
    - Complicated adult topics (politics, dating, money, etc.).
    - Negative judgments or scary news.

5. **Interaction Style**
    - Always encourage, never criticize ❤️.
    - Give praise: "Great job! 🎉 You're learning so well."
    - If child asks something unsafe, gently redirect:
        
        ↳ "That's a bit too tricky for now 🤔. Let's learn about [fun safe topic] instead!"
        
    - Ask small friendly questions to keep them engaged (e.g., "Do you like cats 🐱 or dogs 🐶 more?").

6. **Formatting**
    - Use **lists, emojis, and short paragraphs**.
    - No long walls of text.
    - Use **bold** for important words.

---

### Example Style

👦 Child: *"What is the moon?"*

🤖 Bot: "The **moon** 🌙 is like Earth's best friend in the sky! Imagine a big silver ball that shines at night, like a night-light 🌟. Sometimes it looks like a banana 🍌 (that's called a crescent), and sometimes like a full round cookie 🍪 (that's a full moon). Cool, right?"`;

// Helper: call Gemini text generation
async function callGeminiText(apiKey: string, contents: any[], generationConfig?: any): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
  const body: any = { contents };
  if (generationConfig) body.generationConfig = generationConfig;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Gemini text API error:`, response.status, errorText);
    if (response.status === 429) throw new Error('RATE_LIMITED');
    throw new Error(`Gemini API error: ${response.status}`);
  }

  return response.json();
}

// Generate image using Gemini image model
async function generateImage(apiKey: string, prompt: string): Promise<{ imageBase64: string; mimeType: string } | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image gen error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) return null;

    for (const part of parts) {
      if (part.inlineData) {
        return { imageBase64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
      }
    }
    return null;
  } catch (e) {
    console.error('Image generation error:', e);
    return null;
  }
}

type VideoGenerationSuccess = {
  ok: true;
  videoBase64: string;
  mimeType: string;
  modelUsed: string;
};

type VideoGenerationFailure = {
  ok: false;
  reason: 'rate_limited' | 'timeout' | 'failed';
};

type VideoGenerationResult = VideoGenerationSuccess | VideoGenerationFailure;

const VIDEO_MODELS = [
  'veo-3.1-fast-generate-preview',
  'veo-2.0-generate-001',
  'veo-3.1-generate-preview',
] as const;

const VIDEO_POLL_INTERVAL_MS = 4000;
const VIDEO_HARD_DEADLINE_MS = 80000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRateLimitError(error: unknown): boolean {
  const errorText = typeof error === 'string'
    ? error
    : error instanceof Error
      ? `${error.name} ${error.message}`
      : JSON.stringify(error);

  return errorText.includes('429') || errorText.includes('RESOURCE_EXHAUSTED');
}

// Generate video using Google GenAI SDK (admin only)
async function generateVideo(apiKey: string, prompt: string): Promise<VideoGenerationResult> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const childFriendlyPrompt = createChildFriendlyVideoPrompt(prompt);

    const startedAt = Date.now();
    const hasTimeRemaining = (bufferMs = 0) => Date.now() - startedAt < (VIDEO_HARD_DEADLINE_MS - bufferMs);

    let sawRateLimit = false;
    let sawTimeout = false;

    for (const model of VIDEO_MODELS) {
      if (!hasTimeRemaining(15000)) {
        sawTimeout = true;
        break;
      }

      console.log(`Starting video generation with model: ${model}`);

      let operation: any | null = null;

      for (let startAttempt = 1; startAttempt <= 2; startAttempt++) {
        try {
          operation = await ai.models.generateVideos({
            model,
            prompt: childFriendlyPrompt,
            config: { numberOfVideos: 1 },
          });
          break;
        } catch (error) {
          if (isRateLimitError(error)) {
            sawRateLimit = true;
            console.warn(`Rate limited while starting ${model} (attempt ${startAttempt}/2)`);
            if (startAttempt < 2 && hasTimeRemaining(20000)) await sleep(8000 * startAttempt);
            continue;
          }

          console.error(`Failed to start video generation with ${model}:`, error);
          break;
        }
      }

      if (!operation) continue;

      const maxAttempts = model.includes('fast') ? 10 : 8;
      let attempts = 0;

      while (!operation.done && attempts < maxAttempts && hasTimeRemaining(10000)) {
        console.log(`Waiting for video generation (${model})... (attempt ${attempts + 1}/${maxAttempts})`);
        await sleep(VIDEO_POLL_INTERVAL_MS);

        try {
          operation = await ai.operations.getVideosOperation({ operation });
        } catch (pollError) {
          if (isRateLimitError(pollError)) {
            sawRateLimit = true;
            console.warn(`Rate limited while polling ${model}, retrying...`);
            if (hasTimeRemaining(12000)) await sleep(5000);
            attempts++;
            continue;
          }

          console.error(`Polling failed for ${model}:`, pollError);
          operation = null;
          break;
        }

        attempts++;
      }

      if (!operation) continue;

      if (!operation.done) {
        sawTimeout = true;
        console.warn(`Video generation timed out for ${model}`);
        continue;
      }

      if (operation.error) {
        if (isRateLimitError(operation.error)) sawRateLimit = true;
        console.error(`Video generation failed for ${model}:`, operation.error);
        continue;
      }

      const videoFile = operation.response?.generatedVideos?.[0]?.video;
      if (!videoFile) {
        console.error(`No video data found for ${model}`);
        continue;
      }

      const tempFilePath = `/tmp/generated-video-${Date.now()}.mp4`;

      try {
        await ai.files.download({
          file: videoFile,
          downloadPath: tempFilePath,
        });

        const videoBytes = await Deno.readFile(tempFilePath);
        return {
          ok: true,
          videoBase64: uint8ToBase64(videoBytes),
          mimeType: videoFile.mimeType || 'video/mp4',
          modelUsed: model,
        };
      } catch (downloadError) {
        console.error(`SDK download failed for ${model}, trying URI fallback:`, downloadError);

        if (!videoFile.uri) continue;

        const uriResponse = await fetch(videoFile.uri, {
          headers: { 'x-goog-api-key': apiKey },
        });

        if (!uriResponse.ok) {
          const errorText = await uriResponse.text();
          console.error(`URI download failed for ${model}:`, uriResponse.status, errorText);
          continue;
        }

        const uriBytes = new Uint8Array(await uriResponse.arrayBuffer());
        return {
          ok: true,
          videoBase64: uint8ToBase64(uriBytes),
          mimeType: videoFile.mimeType || 'video/mp4',
          modelUsed: model,
        };
      } finally {
        try {
          await Deno.remove(tempFilePath);
        } catch {
          // no-op
        }
      }
    }

    if (sawRateLimit) return { ok: false, reason: 'rate_limited' };
    if (sawTimeout) return { ok: false, reason: 'timeout' };
    return { ok: false, reason: 'failed' };
  } catch (e) {
    console.error('Video generation error:', e);
    if (isRateLimitError(e)) return { ok: false, reason: 'rate_limited' };
    return { ok: false, reason: 'failed' };
  }
}

// Get external Supabase client for DB operations (anon key, respects RLS)
function getExternalSupabase() {
  const url = Deno.env.get('EXTERNAL_SUPABASE_URL');
  const key = Deno.env.get('EXTERNAL_SUPABASE_ANON_KEY');
  if (!url || !key) return null;
  return createClient(url, key);
}

// Get external Supabase client with service role (bypasses RLS - for abuse detection)
function getExternalSupabaseAdmin() {
  const url = Deno.env.get('EXTERNAL_SUPABASE_URL');
  const key = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    console.error('Missing EXTERNAL_SUPABASE_URL or EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }
  return createClient(url, key);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory, role, sessionToken, userId, userEmail, socialStoriesMode } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not configured');

    const isVideoReq = isVideoRequest(message);
    const isImageReq = !isVideoReq && isImageRequest(message);

    // Video generation - admin only
    if (isVideoReq && role !== 'admin') {
      return new Response(JSON.stringify({
        response: "🔒 **Video generation is only available for Admins!**\n\nTo create videos, you need admin access. Please log in as an admin if you have the secret key.\n\nAs a guest, you can still:\n- Chat with me 💬\n- Generate images 🎨\n- Ask questions 📚\n- Have fun conversations! ✨",
        videoGenerated: false,
        accessDenied: true,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Social Stories mode - always generate image
    if (socialStoriesMode) {
      try {
        const imagePrompt = createSocialStoryPrompt(message);
        const imageResult = await generateImage(GEMINI_API_KEY, imagePrompt);

        if (imageResult) {
          const textResponse = `📚 **Here's your social story about "${message}"!** ✨\n\nI created a 6-panel comic to help you understand this situation better! 😊\n\nEach panel shows you what to do, step by step. You can look at the pictures and read the words under each one.\n\n**Would you like another social story?** Just tell me what situation you want to learn about! 🌟`;

          // Save to DB
          if (userId) {
            try {
              const extDb = getExternalSupabase();
              if (extDb) {
                await extDb.from('generated_images').insert({
                  user_id: userId, prompt: message, mode: 'social_stories',
                  image_data: imageResult.imageBase64, mime_type: imageResult.mimeType,
                });
                await extDb.from('chat_history').insert([
                  { user_id: userId, role: 'user', message_text: message, mode: 'social_stories' },
                  { user_id: userId, role: 'assistant', message_text: textResponse, mode: 'social_stories' },
                ]);
              }
            } catch (e) { console.error('DB save error:', e); }
          }

          return new Response(JSON.stringify({
            response: textResponse,
            imageGenerated: true,
            imageData: imageResult.imageBase64,
            mimeType: imageResult.mimeType,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          response: `📚 **I could not render the social story image this time.** 😔\n\nPlease try again, and I will sketch it again for you.`,
          imageGenerated: false,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (imgError) {
        console.error('Social story image error:', imgError);
        return new Response(JSON.stringify({
          response: "I'm having trouble creating the social story image right now. Please try again! 📚",
          imageGenerated: false,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Regular image generation
    if (isImageReq) {
      try {
        const imagePrompt = createChildFriendlyPrompt(message);
        const imageResult = await generateImage(GEMINI_API_KEY, imagePrompt);

        if (imageResult) {
          const textResponse = `🎨 **I created an image for you!** ✨\n\nI hope you like it! 😊 What do you think about the image? Would you like me to create another one or explain something about what's in the picture?`;

          if (userId) {
            try {
              const extDb = getExternalSupabase();
              if (extDb) {
                await extDb.from('generated_images').insert({
                  user_id: userId, prompt: message, mode: 'general',
                  image_data: imageResult.imageBase64, mime_type: imageResult.mimeType,
                });
                await extDb.from('chat_history').insert([
                  { user_id: userId, role: 'user', message_text: message, mode: 'general' },
                  { user_id: userId, role: 'assistant', message_text: textResponse, mode: 'general' },
                ]);
              }
            } catch (e) { console.error('DB save error:', e); }
          }

          return new Response(JSON.stringify({
            response: textResponse,
            imageGenerated: true,
            imageData: imageResult.imageBase64,
            mimeType: imageResult.mimeType,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        // Fall through to text if image failed
      } catch (imgError) {
        console.error('Image generation error:', imgError);
      }
    }

    // Video generation for admin using Veo
    if (isVideoReq && role === 'admin') {
      try {
        const videoResult = await generateVideo(GEMINI_API_KEY, message);

        if (videoResult.ok) {
          const textResponse = `🎬 **Your video is ready!** ✨\n\nI generated a child-friendly video for you using ${videoResult.modelUsed}. 😊`;

          if (userId) {
            try {
              const extDb = getExternalSupabase();
              if (extDb) {
                await extDb.from('generated_videos').insert({
                  user_id: userId, prompt: message,
                  video_data: videoResult.videoBase64, mime_type: videoResult.mimeType,
                });
                await extDb.from('chat_history').insert([
                  { user_id: userId, role: 'user', message_text: message, mode: 'general' },
                  { user_id: userId, role: 'assistant', message_text: textResponse, mode: 'general' },
                ]);
              }
            } catch (e) { console.error('DB save error:', e); }
          }

          return new Response(JSON.stringify({
            response: textResponse,
            videoGenerated: true,
            videoData: videoResult.videoBase64,
            mimeType: videoResult.mimeType,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (videoResult.reason === 'rate_limited') {
          return new Response(JSON.stringify({
            response: `🎬 **Video service is busy right now.** Please wait 1–2 minutes and try again.`,
            videoGenerated: false,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (videoResult.reason === 'timeout') {
          return new Response(JSON.stringify({
            response: `⏱️ **Video generation is taking longer than expected.** Please retry and I'll try again.`,
            videoGenerated: false,
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({
          response: `🎬 **Video generation failed this time.** Please try again.`,
          videoGenerated: false,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (vidError) {
        console.error('Video generation error:', vidError);
        return new Response(JSON.stringify({
          response: "Video generation encountered an error. Please try again! 🎬",
          videoGenerated: false,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Run abuse detection in background (don't block response)
    const extDbForAbuse = getExternalSupabaseAdmin();
    const abusePromise = runAbuseDetection(GEMINI_API_KEY, extDbForAbuse, userId, userEmail, message);

    // Regular text chat using Gemini generateContent API
    const historyParts = (conversationHistory || []).slice(-10).map((h: any) => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));

    const contents = [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'model', parts: [{ text: 'Understood! I will follow all the rules above.' }] },
      ...historyParts,
      { role: 'user', parts: [{ text: message }] },
    ];

    const data = await callGeminiText(GEMINI_API_KEY, contents, {
      maxOutputTokens: 800,
      temperature: 0.7,
    });

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to help! 😊";

    // Wait for abuse detection to complete (non-blocking for user)
    try { await abusePromise; } catch (e) { console.error('Abuse detection error:', e); }

    // Save chat to external database
    if (userId) {
      try {
        const extDb = getExternalSupabase();
        if (extDb) {
          await extDb.from('chat_history').insert([
            { user_id: userId, role: 'user', message_text: message, mode: 'general' },
            { user_id: userId, role: 'assistant', message_text: aiResponse, mode: 'general' },
          ]);
        }
      } catch (dbError) {
        console.error('DB save error:', dbError);
      }
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    if (error.message === 'RATE_LIMITED') {
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment and try again! 😊' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: error.message || 'Something went wrong' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
