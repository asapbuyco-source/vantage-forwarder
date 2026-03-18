require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a structured weekly posting plan.
 * Returns a JSON array of scheduled posts.
 */
async function generateWeeklyPlan() {
    const systemPrompt = `You are an expert Social Media Manager for a popular Football (Soccer) Facebook Page.
Your goal is to create a highly engaging, viral 7-day content schedule.
For each day, provide a topic, a specific post angle, and an ideal time of day to post it.

Return ONLY a valid JSON array of objects with the following schema:
[
  {
    "day": "Monday",
    "theme": "Match Analysis",
    "prompt": "Write a deep dive into the weekend's biggest Premier League match. Ask followers for their MVP.",
    "time": "09:00"
  }
]
No markdown wrapping, just the raw JSON array.`;

    try {
        console.log('🤖 AI: Generating new weekly plan...');
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "Create this week's football content plan." }
            ],
            temperature: 0.7,
        });

        const planText = response.choices[0].message.content.trim();
        // Fallback cleanup in case it wraps in markdown anyway
        const cleanJson = planText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('❌ AI Plan Generation Error:', error.message);
        return null;
    }
}

/**
 * Crafts the actual Facebook post content based on the planned topic.
 */
async function generatePostContent(topicPrompt) {
    const systemPrompt = `You are a viral Football Facebook Page Marketer.
Write an engaging, exciting, and professional Facebook post based on the user's prompt.
Include exactly 3-5 relevant emojis and 3-5 trending football hashtags.
End with a strong call-to-action asking followers to comment their opinion.`;

    try {
        console.log(`🤖 AI: Writing post for topic: "${topicPrompt.substring(0, 30)}..."`);
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: topicPrompt }
            ],
            temperature: 0.8,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('❌ AI Content Generation Error:', error.message);
        return null;
    }
}

/**
 * Generates a DALL-E image prompt from the post content and fetches the image URL.
 */
async function generatePostImage(postContent) {
    try {
        console.log('🤖 AI: Designing image prompt based on content...');
        const promptResponse = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You extract the core visual essence of the provided football social media post and write a highly detailed, photorealistic prompt for DALL-E 3 image generation. Focus on high-quality, cinematic sports imagery." },
                { role: "user", content: postContent }
            ],
            temperature: 0.7,
        });

        const dallePrompt = promptResponse.choices[0].message.content.trim();
        
        console.log('🖼️ AI: Generating image with DALL-E 3...');
        const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: dallePrompt,
            n: 1,
            size: "1024x1024",
        });

        return imageResponse.data[0].url;
    } catch (error) {
        console.error('❌ AI Image Generation Error:', error.message);
        return null;
    }
}

/**
 * Instantly rewrites a raw Telegram alert into a professional Facebook post.
 */
async function rewriteTelegramAlert(rawText) {
    const systemPrompt = `You are a Breaking News Football Social Media Editor.
A new alert just came in from our Telegram source.
Rewrite it into an urgent, exciting, and professional Facebook Post.
Include emojis, formatting, and relevant hashtags. Make it sound like it's coming from an authoritative sports news page.`;

    try {
        console.log('🤖 AI: Rewriting breaking Telegram alert...');
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: rawText }
            ],
            temperature: 0.7,
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error('❌ AI Rewrite Error:', error.message);
        return null;
    }
}

module.exports = {
    generateWeeklyPlan,
    generatePostContent,
    generatePostImage,
    rewriteTelegramAlert
};
