require('dotenv').config();

// Helper function to pick a random item from an array
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates a structured weekly posting plan using predefined templates.
 * Returns a JSON array of scheduled posts.
 */
async function generateWeeklyPlan() {
    console.log('🤖 System: Generating new weekly plan from templates...');
    const plans = [
        [
            { day: "Monday", theme: "Weekend Review", prompt: "weekend match analysis", time: "09:00" },
            { day: "Tuesday", theme: "Tactical Tuesday", prompt: "deep dive into team tactics", time: "11:00" },
            { day: "Wednesday", theme: "Midweek Action", prompt: "midweek fixtures and predictions", time: "12:00" },
            { day: "Thursday", theme: "Europa League", prompt: "Europa league analysis", time: "14:00" },
            { day: "Friday", theme: "Weekend Preview", prompt: "upcoming weekend matches overview", time: "15:00" },
            { day: "Saturday", theme: "Matchday Live", prompt: "Saturday premium picks", time: "11:00" },
            { day: "Sunday", theme: "Super Sunday", prompt: "Sunday major derby matches", time: "10:00" }
        ],
        [
            { day: "Monday", theme: "Betting Recap", prompt: "review of our latest betting tips", time: "09:00" },
            { day: "Tuesday", theme: "Champions League", prompt: "European football nights", time: "10:00" },
            { day: "Wednesday", theme: "Value Bets", prompt: "finding the best value in the market", time: "14:00" },
            { day: "Thursday", theme: "Underdog Picks", prompt: "finding the upset of the week", time: "12:00" },
            { day: "Friday", theme: "Acca Friday", prompt: "building the perfect accumulator", time: "16:00" },
            { day: "Saturday", theme: "Saturday Selections", prompt: "top picks for the day", time: "10:00" },
            { day: "Sunday", theme: "Sunday Showdown", prompt: "biggest matches to watch today", time: "09:00" }
        ]
    ];
    return random(plans);
}

/**
 * Crafts the actual Facebook post content based on the planned topic.
 * Uses SEO optimized templates and spins content.
 */
async function generatePostContent(topicPrompt) {
    console.log(`🤖 System: Generating post for topic: "${topicPrompt}"`);
    
    const intros = [
        "⚽ Huge day for football fans! Let's get right into it.",
        "🔥 Matchday excitement is in the air. Here's what you need to know.",
        "🏆 Top tier football action is upon us. Let's break down the details.",
        "⚡ Massive updates for the football community today.",
        "📈 Looking for the best football insights? We've got you covered."
    ];
    
    const bodies = [
        `Today we are zeroing in on ${topicPrompt}. The statistics are showing some incredible patterns.`,
        `When it comes to ${topicPrompt}, the market is moving fast. Here is our expert take.`,
        `Our latest analysis focuses deeply on ${topicPrompt}. You won't want to miss this value.`,
        `We've run the numbers and the data around ${topicPrompt} is absolutely massive.`
    ];

    const outros = [
        "What's your prediction? Drop a comment below! 👇",
        "Do you agree with our take? Let us know in the comments! 🗣️",
        "Who is your MVP today? Comment your thoughts! 🔮",
        "Make sure to follow us for more premium football picks! 🎯"
    ];

    const hashtags = [
        "#FootballPredictions #SoccerTips #BettingExpert #Matchday",
        "#PremierLeague #FootballCommunity #ValueBets #SoccerNews",
        "#SportsBetting #FootballAnalysis #WinningTips #Soccer"
    ];

    return `${random(intros)}\n\n${random(bodies)}\n\n${random(outros)}\n\n${random(hashtags)}`;
}

/**
 * Provides a highly engaging, SEO optimized stock image URL for the post.
 */
async function generatePostImage(postContent) {
    console.log('🖼️ System: Fetching high-quality football image...');
    
    const images = [
        "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1024", // football on pitch
        "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1024", // pitch close up
        "https://images.unsplash.com/photo-1511886929837-354d827aae26?q=80&w=1024", // ball on grass sunset
        "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=1024", // football field lines
        "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1024", // stadium seats
        "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Camp_Nou_Panoramica_2013.jpg/1024px-Camp_Nou_Panoramica_2013.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Santiago_Bernabeu_Stadium_-_panoramic_view.jpg/1024px-Santiago_Bernabeu_Stadium_-_panoramic_view.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Wembley_Stadium_interior.jpg/1024px-Wembley_Stadium_interior.jpg"
    ];

    return random(images);
}

/**
 * Rewrites a raw Telegram alert into a professional, SEO-friendly Facebook post.
 */
async function rewriteTelegramAlert(rawText) {
    console.log('🤖 System: Processing breaking Telegram alert...');
    
    const lowerText = rawText.toLowerCase();
    let detectedKeyword = "this match";
    
    // Keyword extraction for SEO
    if (lowerText.includes("over 2.5") || lowerText.includes("over 1.5")) {
        detectedKeyword = "the Over goals market";
    } else if (lowerText.includes("under")) {
        detectedKeyword = "the Under goals market";
    } else if (lowerText.includes("win") || lowerText.includes("1x2") || lowerText.includes("ml")) {
        detectedKeyword = "a straight win prediction";
    } else if (lowerText.includes("btts") || lowerText.includes("both teams to score")) {
        detectedKeyword = "Both Teams to Score (BTTS)";
    } else if (lowerText.includes("corner")) {
        detectedKeyword = "the corner market";
    }

    const intros = [
        "🚨 BREAKING ALERT 🚨\n━━━━━━━━━━━━━━━━━━━━", 
        "⚡ URGENT MATCH UPDATE ⚡\n━━━━━━━━━━━━━━━━━━━━", 
        "🔥 PREMIUM PICK DETECTED 🔥\n━━━━━━━━━━━━━━━━━━━━",
        "🎯 NEW INSIGHT JUST IN 🎯\n━━━━━━━━━━━━━━━━━━━━"
    ];
    
    const bodies = [
        `Our advanced tracking system has just identified massive value concerning ${detectedKeyword}! 📈`,
        `We are seeing huge sharp money movements regarding ${detectedKeyword}. 💸`,
        `Don't miss out on this high-confidence alert for ${detectedKeyword}. 🔥`,
        `Top tier intelligence suggests a huge opportunity in ${detectedKeyword}. 🏆`
    ];
    
    // Make the raw prediction text stand out beautifully
    const formattedRawText = rawText.split('\n').map(line => `🔹 ${line.trim()}`).join('\n');

    const details = [
        `👇 *THE BREAKDOWN* 👇\n\n${formattedRawText}\n\n━━━━━━━━━━━━━━━━━━━━`,
        `📌 *ALERT DETAILS* 📌\n\n${formattedRawText}\n\n━━━━━━━━━━━━━━━━━━━━`,
        `✅ *PREDICTION DATA* ✅\n\n${formattedRawText}\n\n━━━━━━━━━━━━━━━━━━━━`
    ];
    
    const outros = [
        "Act fast before the odds drop! ⏰", 
        "What's your move? Let us know below! 👇", 
        "Let's lock this in! 💪",
        "Are you tailing this? Drop a comment! 🗣️"
    ];

    const hashtags = [
        "#FootballAlert #SoccerPicks #BettingTips #SportsBetting #LiveOdds",
        "#MatchPrediction #ValueBet #SoccerTips #FootballCommunity",
        "#InPlayBetting #FootballNews #Soccer #BettingExpert"
    ];
    
    return `${random(intros)}\n\n${random(bodies)}\n\n${random(details)}\n\n${random(outros)}\n\n${random(hashtags)}`;
}

module.exports = {
    generateWeeklyPlan,
    generatePostContent,
    generatePostImage,
    rewriteTelegramAlert
};
