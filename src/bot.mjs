import TeleBot from "telebot";
import shortReply from "telebot/plugins/shortReply.js";

// Функция для отправки запроса на генерацию аудиофайла
const fetchAudio = async (query) => {
    const response = await fetch('https://books-dh3f.onrender.com/generate-audio-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const data = await response.json();
    return data;
};

// Функция для проверки статуса задачи по task_id
const checkTaskStatus = async (task_id) => {
    const response = await fetch(`https://books-dh3f.onrender.com/task-status/${task_id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
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
        // Запрашиваем создание задачи на генерацию аудиофайла
        const data = await fetchAudio(title);
        const task_id = data.task_id;

        if (data.status === 'pending') {
            await msg.reply.text('Генерация аудиофайла началась, пожалуйста, подождите.');

            // Устанавливаем таймаут на 30 секунд для проверки статуса задачи
            setTimeout(async () => {
                try {
                    const statusData = await checkTaskStatus(task_id);

                    if (statusData.status === 'completed') {
                        const file_url = statusData.file_url;
                        await bot.sendVoice(msg.chat.id, file_url);
                    } else if (statusData.status === 'failed') {
                        await msg.reply.text('Не удалось сгенерировать аудиофайл. Пожалуйста, попробуйте позже.');
                    } else {
                        await msg.reply.text('Генерация аудиофайла всё ещё продолжается. Попробуйте снова позже.');
                    }
                } catch (statusError) {
                    console.error('Error checking task status:', statusError);
                    await msg.reply.text('Произошла ошибка при проверке статуса. Попробуйте снова позже.');
                }
            }, 30000); // 30 секунд

        }else if((data.status === 'completed')){
            const file_url = data.file_url;
            await bot.sendVoice(msg.chat.id, file_url);
        }
         else {
            await msg.reply.text('Произошла ошибка при создании задачи. Попробуйте снова позже.');
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
