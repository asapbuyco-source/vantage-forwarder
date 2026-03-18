const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { generateWeeklyPlan, generatePostContent, generatePostImage } = require('./aiService');
const { postToFacebook } = require('./facebookService');

const SCHEDULE_FILE = path.join(__dirname, '..', 'data', 'schedule.json');

// Helper to read the schedule
function readSchedule() {
    try {
        if (!fs.existsSync(SCHEDULE_FILE)) return [];
        const data = fs.readFileSync(SCHEDULE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('❌ Error reading schedule.json:', err.message);
        return [];
    }
}

// Helper to save the schedule
function saveSchedule(schedule) {
    try {
        fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(schedule, null, 2));
    } catch (err) {
        console.error('❌ Error saving schedule.json:', err.message);
    }
}

/**
 * Executes a single scheduled post.
 */
async function executeScheduledPost(postTask) {
    console.log(`\n========================================`);
    console.log(`⏰ Executing Scheduled Post: ${postTask.theme}`);
    console.log(`========================================`);

    // 1. Generate text
    const text = await generatePostContent(postTask.prompt);
    if (!text) return console.log('⚠️ Failed to generate post text. Aborting.');

    // 2. Generate image
    const imageUrl = await generatePostImage(text);
    if (!imageUrl) return console.log('⚠️ Failed to generate image. Aborting.');

    // 3. Post to Facebook
    await postToFacebook(text, imageUrl);
    
    console.log(`✅ Finished scheduled task for ${postTask.theme}.\n`);
}

/**
 * Generates a brand new plan for the week.
 */
async function createNewWeeklyPlan() {
    console.log('\n📅 Triggering new Weekly Content Plan Generation...');
    const newPlan = await generateWeeklyPlan();
    
    if (newPlan && Array.isArray(newPlan)) {
        // Add a "posted" flag to false for all new items
        const planWithStatus = newPlan.map(item => ({ ...item, posted: false }));
        saveSchedule(planWithStatus);
        console.log('✅ New weekly plan generated and saved successfully.');
        console.log(JSON.stringify(planWithStatus, null, 2));
    } else {
        console.log('❌ Failed to generate weekly plan.');
    }
}

/**
 * Initializes all cron jobs for the Autonomous Agent.
 */
function initScheduler() {
    console.log('⏰ Initializing Autonomous Scheduler...');

    // 1. The Weekly Planner: Runs every Sunday at 23:00 (11 PM)
    cron.schedule('0 23 * * 0', async () => {
        await createNewWeeklyPlan();
    });

    // 2. The Daily Executor: Checks every hour on the hour if there's a post scheduled
    cron.schedule('0 * * * *', async () => {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        
        // Format current hour as "HH:00"
        const currentHour = now.getHours().toString().padStart(2, '0') + ':00';
        
        console.log(`[Hourly Check]: Looking for scheduled posts for ${currentDay} at ${currentHour}`);

        let schedule = readSchedule();
        let updated = false;

        for (let i = 0; i < schedule.length; i++) {
            const task = schedule[i];
            
            // If it matches the day, hour, and hasn't been posted yet
            if (!task.posted && task.day === currentDay && task.time === currentHour) {
                // Execute immediately but don't block the loop
                executeScheduledPost(task);
                
                // Mark as posted
                schedule[i].posted = true;
                updated = true;
            }
        }

        if (updated) {
            saveSchedule(schedule);
        }
    });

    console.log('✅ Scheduler active. Awaiting tasks.');
}

module.exports = {
    initScheduler,
    createNewWeeklyPlan, // Exported mainly for testing/manual triggering
    readSchedule
};
