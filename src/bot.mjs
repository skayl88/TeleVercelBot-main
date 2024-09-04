import TeleBot from "telebot";
import shortReply from "telebot/plugins/shortReply.js";

const fetchAudio = async (query) => {
    const response = await fetch('https://books-dh3f.onrender.com/generate-audio-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const data = await response.json();
    return data;
};

const checkTaskStatus = async (task_id) => {
    const response = await fetch(`https://books-dh3f.onrender.com/task-status/${task_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return data;
};

// Функция для обработки текста и отправки аудио
const customText = async (msg) => {
    const title = msg.text?.trim(); // Убираем лишние пробелы

    if (!title) {
        await msg.reply.text('Пожалуйста, отправьте текст для озвучивания.');
        return;
    }

    try {
        const data = await fetchAudio(title);
        
        if (data.status === "pending") {
            await msg.reply.text('Ваш запрос обрабатывается. Это может занять до одной минуты.');
            
            const task_id = data.task_id;

            // Функция для проверки статуса задачи через минуту
            const pollTaskStatus = async () => {
                const taskData = await checkTaskStatus(task_id);

                if (taskData.status === "completed") {
                    const file_url = taskData.file_url;
                    await bot.sendVoice(msg.chat.id, file_url);
                } else if (taskData.status === "failed") {
                    await msg.reply.text('Произошла ошибка при обработке задачи. Попробуйте позже.');
                } else {
                    // Если задача еще не завершена, проверим снова через минуту
                    setTimeout(pollTaskStatus, 40000); // Повторный запрос через минуту (60 000 мс)
                }
            };

            // Запускаем первый запрос через минуту
            setTimeout(pollTaskStatus,40000);
        } else if (data.status === "completed") {
            const file_url = data.file_url;
            await bot.sendVoice(msg.chat.id, file_url);
        }
    } catch (error) {
        console.error('Error generating audio:', error);
        await msg.reply.text('Произошла ошибка при преобразовании текста в аудио. Попробуйте снова позже.');
    }
};

// Создаем бота с использованием токена
const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// Обработка текстовых сообщений
bot.on("text", customText);

// Подключение плагина shortReply
bot.plug(shortReply);

export default bot;
