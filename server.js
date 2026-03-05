require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

// 1. Telegram Webhook Endpoint
app.post('/telegram-webhook', async (req, res) => {
    try {
        const update = req.body;
        console.log('\n--- New Telegram Update ---');
        console.log('Received payload:', JSON.stringify(update, null, 2));

        // Detect channel_post.text
        if (update.channel_post && update.channel_post.text) {
            const messageText = update.channel_post.text;
            console.log(`Extracted message text: "${messageText}"`);

            // 2. Facebook Auto Posting
            await postToFacebook(messageText);
        } else {
            console.log('Update does not contain a standard channel text post. Ignoring.');
        }

        // Always respond with 200 OK so Telegram knows the webhook was received
        res.status(200).send('OK');
    } catch (error) {
        console.error('Error handling Telegram webhook:', error.message);
        res.status(500).send('Internal Server Error');
    }
});

// Function to post to Facebook Page using Graph API
async function postToFacebook(message) {
    try {
        console.log('Attempting to post to Facebook...');
        const url = `https://graph.facebook.com/${FACEBOOK_PAGE_ID}/feed`;
        const response = await axios.post(url, {
            message: message,
            access_token: FACEBOOK_PAGE_ACCESS_TOKEN
        });
        console.log('✅ Successfully posted to Facebook Page. Post ID:', response.data.id);
    } catch (error) {
        console.error('❌ Facebook Graph API Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

// Simple health check endpoint for Railway
app.get('/', (req, res) => {
    res.send('Vantage Telegram-to-Facebook Forwarder is running!');
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server started and listening on port ${PORT}`);
    console.log('--- Environment Check ---');
    console.log('TELEGRAM_BOT_TOKEN configured:', !!TELEGRAM_BOT_TOKEN);
    console.log('FACEBOOK_PAGE_ID configured:', !!FACEBOOK_PAGE_ID);
    console.log('FACEBOOK_PAGE_ACCESS_TOKEN configured:', !!FACEBOOK_PAGE_ACCESS_TOKEN);
    console.log('Waiting for Telegram webhooks on /telegram-webhook ...');
});
