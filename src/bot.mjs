import TeleBot from "telebot";
import shortReply from "telebot/plugins/shortReply.js";

// Function to send a request for generating an audio file
const fetchAudio = async (query) => {
    const response = await fetch('https://books-dh3f.onrender.com/generate-audio-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const data = await response.json();
    return data;
};

// Function to check the status of the task by task_id
const checkTaskStatus = async (task_id) => {
    const response = await fetch(`https://books-dh3f.onrender.com/task-status/${task_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data;
};

// Function to process the text and send the audio
const customText = async (msg) => {
    const title = msg.text?.trim(); // Remove extra spaces

    if (!title) {
        await msg.reply.text('Please send the text for audio conversion.');
        return;
    }

    try {
        // Request to create a task for generating the audio file
        const data = await fetchAudio(title);
        const task_id = data.task_id;

        if (data.status === 'pending') {
            await msg.reply.text('Audio generation has started, please wait.');

            // Set a 30-second timeout to check the task status
            setTimeout(async () => {
                try {
                    const statusData = await checkTaskStatus(task_id);

                    if (statusData.status === 'completed') {
                        const file_url = statusData.file_url;
                        await bot.sendVoice(msg.chat.id, file_url);
                    } else if (statusData.status === 'failed') {
                        await msg.reply.text('Failed to generate the audio file. Please try again later.');
                    } else {
                        await msg.reply.text('Audio generation is still in progress. Please try again later.');
                    }
                } catch (statusError) {
                    console.error('Error checking task status:', statusError);
                    await msg.reply.text('An error occurred while checking the task status. Please try again later.');
                }
            }, 30000); // 30 seconds

        } else if (data.status === 'completed') {
            const file_url = data.file_url;
            await bot.sendVoice(msg.chat.id, file_url);
        } else {
            await msg.reply.text('An error occurred while creating the task. Please try again later.');
        }

    } catch (error) {
        console.error('Error generating audio:', error);
        await msg.reply.text('An error occurred during the text-to-audio conversion. Please try again later.');
    }
};

// Create the bot using the token
const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// Handle text messages
bot.on("text", customText);

// Plugin for short replies
bot.plug(shortReply);

export default bot;
