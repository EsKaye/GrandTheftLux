import 'dotenv/config';
import fetch from 'node-fetch';
import {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  Interaction
} from 'discord.js';
import { scheduleNightlyCouncilReport, sendCouncilReport } from './nightlyReport';

const TOKEN = process.env.DISCORD_TOKEN!;
const OWNER_ID = process.env.OWNER_ID!;
const MCP_URL = process.env.MCP_URL!;

// Setup Discord client with minimal intents.
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

// Register slash commands on startup.
client.once('ready', async () => {
  try {
    await client.application?.commands.set([
      new SlashCommandBuilder()
        .setName('councilreport')
        .setDescription('Dispatch the council report now.')
        .toJSON()
    ]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Failed to register commands:', err);
  }

  scheduleNightlyCouncilReport(client);
  // eslint-disable-next-line no-console
  console.log(`Serafina is online as ${client.user?.tag}`);
});

// Manual trigger via slash command.
client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName === 'councilreport') {
    if (interaction.user.id !== OWNER_ID) {
      await interaction.reply({ content: 'Unauthorized', ephemeral: true });
      return;
    }
    await interaction.reply({ content: 'Gathering council report...', ephemeral: true });
    await sendCouncilReport(client);
    await interaction.followUp({ content: 'Report dispatched.', ephemeral: true });
  }
});

// Basic message router to Unity guardians via MCP OSC bridge.
client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;
  // Format: !whisper <GuardianName> <message>
  const match = msg.content.match(/^!whisper\s+(\w+)\s+(.+)/i);
  if (!match) return;
  const [, guardian, text] = match;

  try {
    await fetch(`${MCP_URL}/osc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: `/guardians/${guardian}`, value: text })
    });
    await msg.react('📡');
  } catch (err) {
    await msg.react('⚠️');
    // eslint-disable-next-line no-console
    console.error('OSC relay error:', err);
  }
});

client.login(TOKEN);
