import TeleBot from "telebot";
import shortReply from "telebot/plugins/shortReply.js";

const API_URL = 'https://books-dh3f.onrender.com';

// Функция для получения статуса задачи
const fetchTaskStatus = async (taskId) => {
    const response = await fetch(`${API_URL}/task-status/${taskId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    return data;
};

// Функция для отправки запроса на генерацию аудиокниги
const fetchAudio = async (query) => {
    const response = await fetch(`${API_URL}/generate-audio-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
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
        // Отправляем запрос на генерацию аудиокниги
        const initialData = await fetchAudio(title);

        // Проверяем, был ли отправлен task_id
        const { task_id, status } = initialData;

        if (status === 'pending') {
            await msg.reply.text('Генерация книги начата, подождите...');
        }

        // Периодически проверяем статус задачи
        let taskStatus = 'pending';
        let resultData = null;

        while (taskStatus === 'pending') {
            await new Promise(resolve => setTimeout(resolve, 5000));  // Ожидаем 5 секунд перед следующим запросом

            resultData = await fetchTaskStatus(task_id);
            taskStatus = resultData.status;

            if (taskStatus === 'completed') {
                break;
            }

            if (taskStatus === 'failed') {
                throw new Error(resultData.error || 'Произошла ошибка при генерации аудиокниги.');
            }
        }

        // Если задача завершена, отправляем аудио
        const file_url = resultData.file_url;
        await bot.sendVoice(msg.chat.id, file_url);

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
