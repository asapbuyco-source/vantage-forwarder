require('dotenv').config();
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const WHATSAPP_GROUP_NAME = process.env.WHATSAPP_GROUP_NAME;
const APP_URL = process.env.APP_URL;

// Initialize WhatsApp Web Client
let whatsappStatus = 'initializing';

const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

whatsappClient.on('qr', (qr) => {
    whatsappStatus = 'qr_ready';
    console.log('\n--- WhatsApp QR Code ---');
    console.log('Scan this code with your WhatsApp app to log in:');
    qrcode.generate(qr, { small: true });
});

whatsappClient.on('ready', () => {
    whatsappStatus = 'ready';
    console.log('✅ WhatsApp Web Client is ready!');
});

whatsappClient.on('disconnected', (reason) => {
    whatsappStatus = 'disconnected';
    console.log('❌ WhatsApp was disconnected:', reason);
    // Attempt to re-initialize
    whatsappClient.initialize();
});

whatsappClient.on('change_state', (state) => {
    console.log('ℹ️ WhatsApp State Change:', state);
});

whatsappClient.on('auth_failure', (msg) => {
    whatsappStatus = 'auth_failure';
    console.error('❌ WhatsApp Authentication failure:', msg);
});

whatsappClient.initialize();

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

                // 3. WhatsApp Auto Posting
                await postToWhatsApp(messageText);
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
        console.log('Attempting to post to Facebook with image as form-data...');
        const imageUrl = 'https://i.ibb.co/jkPLx2NW/Chat-GPT-Image-Mar-6-2026-10-59-36-PM.png';
        const url = `https://graph.facebook.com/${FACEBOOK_PAGE_ID}/photos`;

        // 1. Download image as a stream
        const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });

        // 2. Prepare FormData
        const form = new FormData();
        form.append('source', imageResponse.data);
        form.append('caption', message);
        form.append('access_token', FACEBOOK_PAGE_ACCESS_TOKEN);

        // 3. Post to Facebook using multipart form-data
        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('✅ Successfully posted to Facebook Page with image. Post ID:', response.data.id);
    } catch (error) {
        console.error('❌ Facebook Graph API Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    }
}

// Function to post to WhatsApp using whatsapp-web.js
async function postToWhatsApp(message) {
    if (!WHATSAPP_GROUP_NAME) {
        console.log('⚠️ WHATSAPP_GROUP_NAME missing. Skipping WhatsApp forward.');
        return;
    }

    try {
        console.log(`Attempting to forward to WhatsApp group: "${WHATSAPP_GROUP_NAME}"...`);
        
        const chats = await whatsappClient.getChats();
        const group = chats.find(chat => chat.isGroup && chat.name === WHATSAPP_GROUP_NAME);

        if (group) {
            await group.sendMessage(message);
            console.log('✅ Successfully forwarded to WhatsApp group.');
        } else {
            console.error(`❌ Could not find WhatsApp group named "${WHATSAPP_GROUP_NAME}".`);
            console.log('Available groups:', chats.filter(c => c.isGroup).map(c => c.name).join(', '));
        }
    } catch (error) {
        console.error('❌ WhatsApp Web Error:', error.message);
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
    res.json({
        service: 'Vantage Telegram-to-Facebook/WhatsApp Forwarder',
        whatsapp_status: whatsappStatus,
        facebook_token_status: !!FACEBOOK_PAGE_ACCESS_TOKEN ? 'configured' : 'missing'
    });
});

// Start Server
app.listen(PORT, async () => {
    console.log(`🚀 Server started and listening on port ${PORT}`);
    console.log('--- Environment Check ---');
    console.log('TELEGRAM_BOT_TOKEN configured:', !!TELEGRAM_BOT_TOKEN);
    console.log('FACEBOOK_PAGE_ID configured:', !!FACEBOOK_PAGE_ID);
    console.log('FACEBOOK_PAGE_ACCESS_TOKEN configured:', !!FACEBOOK_PAGE_ACCESS_TOKEN);
    console.log('WHATSAPP_GROUP_NAME configured:', !!WHATSAPP_GROUP_NAME);
    console.log('APP_URL configured:', !!APP_URL);

    // Auto-register webhook
    await registerTelegramWebhook();
});
