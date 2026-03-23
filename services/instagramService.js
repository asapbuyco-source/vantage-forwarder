require('dotenv').config();
const axios = require('axios');

const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
let INSTAGRAM_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

/**
 * Fetches the connected Instagram Professional Account ID if not provided in .env
 */
async function getInstagramAccountId() {
    if (INSTAGRAM_ACCOUNT_ID) return INSTAGRAM_ACCOUNT_ID;
    
    if (!FACEBOOK_PAGE_ID || !FACEBOOK_PAGE_ACCESS_TOKEN) {
        console.error('❌ Cannot fetch Instagram Account ID: Missing Facebook Page ID or Access Token.');
        return null;
    }
    
    try {
        const url = `https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}?fields=instagram_business_account&access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`;
        const response = await axios.get(url);
        
        if (response.data.instagram_business_account && response.data.instagram_business_account.id) {
            INSTAGRAM_ACCOUNT_ID = response.data.instagram_business_account.id;
            console.log(`✅ Dynamically fetched connected Instagram Account ID: ${INSTAGRAM_ACCOUNT_ID}`);
            return INSTAGRAM_ACCOUNT_ID;
        } else {
            console.error('❌ No Instagram Business Account connected to this Facebook Page.');
            return null;
        }
    } catch (error) {
        console.error('❌ Error fetching Instagram Account ID:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        return null;
    }
}

/**
 * Posts an image with a caption to the configured Instagram Account.
 * @param {string} message - The caption text.
 * @param {string} imageUrl - The URL of the image to attach.
 */
async function postToInstagram(message, imageUrl) {
    const igAccountId = await getInstagramAccountId();
    if (!igAccountId || !FACEBOOK_PAGE_ACCESS_TOKEN) {
        console.error('❌ Cannot post to Instagram: Missing Instagram Account ID or Access Token.');
        return;
    }

    try {
        console.log('\n--- 📸 Instagram Graph API ---');
        console.log('1. Creating media container with image URL...');
        
        // 1. Create Media Container
        const containerUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media`;
        const containerResponse = await axios.post(containerUrl, {
            image_url: imageUrl,
            caption: message,
            access_token: FACEBOOK_PAGE_ACCESS_TOKEN
        });
        
        const creationId = containerResponse.data.id;
        console.log('✅ Media container created. Creation ID:', creationId);
        
        console.log('2. Waiting 10 seconds for Instagram to process the image...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        console.log('3. Publishing media container...');
        
        // 2. Publish Media Container
        const publishUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`;
        const publishResponse = await axios.post(publishUrl, {
            creation_id: creationId,
            access_token: FACEBOOK_PAGE_ACCESS_TOKEN
        });
        
        console.log('✅ Successfully published to Instagram. Post ID:', publishResponse.data.id);
        console.log('-------------------------------------------\n');
        
        return publishResponse.data.id;
    } catch (error) {
        console.error('❌ Instagram Graph API Error:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        return null;
    }
}

module.exports = {
    postToInstagram,
    getInstagramAccountId
};
