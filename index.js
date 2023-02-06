import * as Discord from 'discord.js';
import { GatewayIntentBits } from 'discord.js';
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()
const discordClient = new Discord.Client({
  intents: [
    GatewayIntentBits.AutoModerationConfiguration,
    GatewayIntentBits.AutoModerationExecution,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ]
});

const blacklistedTypes = new Set([2, 4, 13])
const monitoredChannels = new Set([])
const blacklistedChannels = new Set([
  '967903592730198046',
  '917465086803718174',
  '986625609847414785',
  '1017457182821855282',
  '917465061692407838',
  '917466789351415848',
  '1017164532558336060',
  '1055821938880159826',
  '973338055786262569',
  '1069669971006869644',
  '967918030082428958',
  '970702101615345728',
  '980803191518142595',
  '1069275638118232064',
  '967912795045785680',
  '968991985690116096',
  '974070904093028463',
  '1038201093806641192',
  '1050788376409817128',
  '1058004452533088307',
  '1064349209043664966',
  '1064349390346670151',
  '1059426051169726484',
  '1059426080596959262',
  '1059426107964784711',
  '1059426311325618266',
  '1059426145294098462',
  '1059426182157848677'
])

discordClient.on('ready', async () => {
  const channels = discordClient.channels.cache;

  channels.forEach((channel) => {
    if (!blacklistedChannels.has(channel.id) && !blacklistedTypes.has(channel.type)) {
      monitoredChannels.add(channel.id)
    }
  })

  console.log("Discord bot is ready!")
})


discordClient.on('messageDelete', async (message) => {
  if (!monitoredChannels.has(message.channel.id)) {
    return
  }

  const attachmentData = [];

  const { content, author, createdTimestamp } = message;
  const { id, username, discriminator } = author;

  if (message?.attachments) {
    message.attachments.forEach((attachment) => {
      attachmentData.push(attachment)
    })
  }

  const formatedData = {
    createdTimestamp: createdTimestamp,
    content: content,
    id: id,
    username: username,
    discriminator: discriminator,
    attachments: attachmentData
  }

  try {
    await prisma.site_discord_deleted_logs.create({
      data: {
        discord_id: formatedData.id,
        username: formatedData.username,
        discriminator: formatedData.discriminator,
        content: formatedData.content,
        attachments: JSON.stringify(formatedData.attachments),
        message_created: new Date(formatedData.createdTimestamp)
      }
    })
  } catch (error) {
    console.log(error)
  } finally {
    await prisma.$disconnect()
  }
})


discordClient.login(process.env.BOT_KEY)