import TeleBot from "telebot";
import shortReply from "telebot/plugins/shortReply.js";

// Функция для получения аудио по названию
const fetchAudio = async (title) => {
    const response = await fetch('https://books-mu-ten.vercel.app/generate-audio-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
    });
    const data = await response.json();
    return data;
};

// Функция для обработки текста и отправки аудио
const customText = async (ctx) => {
    const title = ctx.text?.trim(); // Убираем лишние пробелы

    if (!title) {
        await ctx.reply('Пожалуйста, отправьте текст для озвучивания.');
        return;
    }

    try {
        const data = await fetchAudio(title);
        const file_url = data.file_url;
        await ctx.sendAudio(ctx.chat.id, file_url);
    } catch (error) {
        console.error('Error generating audio:', error);
        await ctx.reply('Произошла ошибка при преобразовании текста в аудио. Попробуйте снова позже.');
    }
};

// Создаем бота с использованием токена
const bot = new TeleBot(process.env.TELEGRAM_BOT_TOKEN);

// Обработка текстовых сообщений
bot.on("text", customText);

// Подключение плагина shortReply
bot.plug(shortReply);

export default bot;
