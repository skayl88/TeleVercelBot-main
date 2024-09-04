import TeleBot from "telebot";
import shortReply from "telebot/plugins/shortReply.js";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// Функция для загрузки аудиофайла
const fetchAudio = async (query) => {
    const response = await fetch('https://books-dh3f.onrender.com/generate-audio-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const data = await response.json();
    return data;
};

// Функция для загрузки файла и отправки в Telegram через содержимое
const sendAudioFile = async (msg, fileUrl, title) => {
    try {
        // Скачиваем аудиофайл
        const response = await fetch(fileUrl);
        const buffer = await response.buffer();

        // Сохраняем файл локально
        const filePath = path.join(__dirname, `${title}.mp3`);
        fs.writeFileSync(filePath, buffer);

        // Отправляем файл в Telegram
        await bot.sendVoice(msg.chat.id, filePath);

        // Удаляем локальный файл после отправки
        fs.unlinkSync(filePath);
    } catch (error) {
        console.error("Error sending audio file:", error);
        await msg.reply.text('Произошла ошибка при отправке аудиофайла. Попробуйте снова позже.');
    }
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
        const file_url = data.file_url;

        // Отправляем аудио через скачанный файл
        await sendAudioFile(msg, file_url, data.title);

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
