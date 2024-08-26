import {setWebhook} from "telebot-vercel"
import bot from "../src/bot.mjs"

export const path = "api/telegram.mjs"

export const config = {runtime: "600"}

export default setWebhook({bot, path, handleErrors: true})
