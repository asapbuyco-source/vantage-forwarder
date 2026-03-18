require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

/**
 * Posts an image with a caption to the configured Facebook Page.
 * @param {string} message - The caption text.
 * @param {string} imageUrl - The URL of the image to attach.
 */
async function postToFacebook(message, imageUrl) {
    if (!FACEBOOK_PAGE_ID || !FACEBOOK_PAGE_ACCESS_TOKEN) {
        console.error('❌ Cannot post to Facebook: Missing Page ID or Access Token.');
        return;
    }

    try {
        console.log('\n--- 📤 Facebook Publishing API ---');
        console.log('Downloading image from:', imageUrl.substring(0, 50) + '...');
        const url = `https://graph.facebook.com/${FACEBOOK_PAGE_ID}/photos`;

        // 1. Download image as a stream
        const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });

        // 2. Prepare FormData
        const form = new FormData();
        form.append('source', imageResponse.data);
        form.append('caption', message);
        form.append('access_token', FACEBOOK_PAGE_ACCESS_TOKEN);

        console.log('Publishing form data to Graph API...');
        
        // 3. Post to Facebook using multipart form-data
        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('✅ Successfully published to Facebook Page. Post ID:', response.data.id);
        console.log('-------------------------------------------\n');
        return response.data.id;
    } catch (error) {
        console.error('❌ Facebook Graph API Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        return null;
    }
}

module.exports = {
    postToFacebook
};
