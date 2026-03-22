require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { rewriteTelegramAlert, generatePostImage } = require('./services/aiService');
const { postToFacebook } = require('./services/facebookService');
const { postToInstagram } = require('./services/instagramService');
const { initScheduler, createNewWeeklyPlan, readSchedule } = require('./services/scheduler');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const APP_URL = process.env.APP_URL;

// ==========================================
// 1. Telegram Webhook (Instant AI Rewrite)
// ==========================================
app.post(`/telegram-webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
    try {
        const update = req.body;
        console.log('\n--- 🚨 New Telegram Alert Received ---');

        if (update.channel_post) {
            const rawText = update.channel_post.text || update.channel_post.caption;

            if (rawText) {
                console.log(`Raw Alert: "${rawText.substring(0, 50)}..."`);

                // 1. AI Rewrite
                const aiPostText = await rewriteTelegramAlert(rawText);
                
                if (aiPostText) {
                    console.log(`\n✨ AI Rewritten Post:\n${aiPostText}\n`);
                    
                    // 2. AI Image Generation
                    const imageUrl = await generatePostImage(aiPostText);

                    if (imageUrl) {
                        // 3. Publish Immediately to Facebook & Instagram
                        await postToFacebook(aiPostText, imageUrl);
                        await postToInstagram(aiPostText, imageUrl);
                    } else {
                        console.log('⚠️ Could not generate image for alert. Skipping Facebook post.');
                    }
                }
            }
        }

        // Always respond with 200 OK
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling Telegram webhook:', error.message);
        res.status(200).send('OK');
    }
});

// ==========================================
// 2. Manual Trigger Endpoints (For Testing)
// ==========================================

// This forces the AI to generate a brand new weekly plan right now
app.post('/api/plan/generate', async (req, res) => {
    console.log('Manual trigger: Generating Weekly Plan...');
    // We run it async so Railway doesn't timeout the HTTP request
    createNewWeeklyPlan()
        .then(() => console.log('Manual plan generation complete.'))
        .catch(err => console.error('Error generating plan manually:', err));
        
    res.json({ message: "Weekly plan generation started. Check logs for progress." });
});

// View the current generated schedule
app.get('/api/plan', (req, res) => {
    const schedule = readSchedule();
    res.json({
        total_scheduled: schedule.length,
        schedule: schedule
    });
});

// ==========================================
// 3. Health & Registration
// ==========================================

async function registerTelegramWebhook() {
    if (!APP_URL || !TELEGRAM_BOT_TOKEN) return;

    const baseUrl = APP_URL.endsWith('/') ? APP_URL.slice(0, -1) : APP_URL;
    const webhookUrl = `${baseUrl}/telegram-webhook/${TELEGRAM_BOT_TOKEN}`;

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
        await axios.post(url, { url: webhookUrl });
        console.log('✅ Webhook successfully registered with Telegram.');
    } catch (error) {
        console.error('❌ Error registering webhook:', error.message);
    }
}

app.get('/', (req, res) => {
    const scheduleCount = readSchedule().length;
    res.json({
        service: 'Vantage Autonomous Facebook AI Marketer',
        status: 'online',
        openai_configured: !!OPENAI_API_KEY,
        facebook_configured: !!FACEBOOK_PAGE_ACCESS_TOKEN,
        posts_scheduled: scheduleCount
    });
});

app.listen(PORT, async () => {
    console.log(`\n🚀 Server started on port ${PORT}`);
    console.log('--- Agent Environment Check ---');
    console.log('TELEGRAM_BOT_TOKEN:', !!TELEGRAM_BOT_TOKEN);
    console.log('FACEBOOK_PAGE_ACCESS_TOKEN:', !!FACEBOOK_PAGE_ACCESS_TOKEN);
    console.log('OPENAI_API_KEY:', !!OPENAI_API_KEY);
    
    // Auto-register webhook
    await registerTelegramWebhook();

    // Start the Autonomous Cron Scheduler if OpenAI is configured
    if (OPENAI_API_KEY) {
        initScheduler();
    } else {
        console.log('⚠️ Scheduler disabled: OPENAI_API_KEY is missing.');
    }
});
