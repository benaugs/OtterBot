import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const priorityUsersFile = path.resolve(__dirname, 'priorityUsers.json');

// Function to read priority users from the JSON file
function readPriorityUsers() {
  if (fs.existsSync(priorityUsersFile)) {
    const data = fs.readFileSync(priorityUsersFile, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('список_приоритетов')
    .setDescription('Показывает список приоритетных пользователей'),

  async execute(interaction) {


    const priorityUsers = readPriorityUsers();

    if (priorityUsers.length === 0) {
      return interaction.reply({ content: 'В приоритетном списке нет пользователей.', ephemeral: true });
    }

    const userList = priorityUsers.map(userId => `<@${userId}>`).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Приоритетные пользователи')
      .setDescription(userList)
      .setTimestamp(new Date());

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
