require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const APP_URL = process.env.APP_URL;

// 1. Telegram Webhook Endpoint - Secured with Token in URL path
app.post(`/telegram-webhook/${TELEGRAM_BOT_TOKEN}`, async (req, res) => {
    try {
        const update = req.body;
        console.log('\n--- New Telegram Update ---');
        console.log('Received payload:', JSON.stringify(update, null, 2));

        // Detect channel_post.text or channel_post.caption
        if (update.channel_post) {
            const messageText = update.channel_post.text || update.channel_post.caption;

            if (messageText) {
                console.log(`Extracted message text: "${messageText}"`);

                // 2. Facebook Auto Posting
                await postToFacebook(messageText);
            } else {
                console.log('Update does not contain text or caption. Ignoring.');
            }
        } else {
            console.log('Update does not contain a channel_post. Ignoring.');
        }

        // Always respond with 200 OK so Telegram knows the webhook was received
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling Telegram webhook:', error.message);
        // Respond with 200 even on error to prevent Telegram from infinitely retrying
        res.status(200).send('OK');
    }
});

// Function to post to Facebook Page using Graph API
async function postToFacebook(message) {
    try {
        console.log('Attempting to post to Facebook with image...');
        const imageUrl = 'https://i.ibb.co/hFYkH7qP/Chat-GPT-Image-Mar-6-2026-10-29-19-PM.png';
        const url = `https://graph.facebook.com/${FACEBOOK_PAGE_ID}/photos`;
        const response = await axios.post(url, {
            url: imageUrl,
            caption: message,
            access_token: FACEBOOK_PAGE_ACCESS_TOKEN
        });
        console.log('✅ Successfully posted to Facebook Page with image. Post ID:', response.data.id);
    } catch (error) {
        console.error('❌ Facebook Graph API Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

// Function to auto-register the webhook with Telegram
async function registerTelegramWebhook() {
    if (!APP_URL || !TELEGRAM_BOT_TOKEN) {
        console.log('⚠️ Missing APP_URL or TELEGRAM_BOT_TOKEN. Check environment variables.');
        return;
    }

    // Ensure APP_URL doesn't end with a slash
    const baseUrl = APP_URL.endsWith('/') ? APP_URL.slice(0, -1) : APP_URL;
    const webhookUrl = `${baseUrl}/telegram-webhook/${TELEGRAM_BOT_TOKEN}`;

    console.log(`Registering webhook: ${webhookUrl}`);

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`;
        const response = await axios.post(url, { url: webhookUrl });
        console.log('✅ Webhook successfully registered:', response.data.description);
    } catch (error) {
        console.error('❌ Error registering webhook:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

// Simple health check endpoint for Railway
app.get('/', (req, res) => {
    res.send('Vantage Telegram-to-Facebook Forwarder is running!');
});

// Start Server
app.listen(PORT, async () => {
    console.log(`🚀 Server started and listening on port ${PORT}`);
    console.log('--- Environment Check ---');
    console.log('TELEGRAM_BOT_TOKEN configured:', !!TELEGRAM_BOT_TOKEN);
    console.log('FACEBOOK_PAGE_ID configured:', !!FACEBOOK_PAGE_ID);
    console.log('FACEBOOK_PAGE_ACCESS_TOKEN configured:', !!FACEBOOK_PAGE_ACCESS_TOKEN);
    console.log('APP_URL configured:', !!APP_URL);

    // Auto-register webhook
    await registerTelegramWebhook();
});
