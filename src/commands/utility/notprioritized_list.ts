import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const priorityUsersFile = path.resolve(__dirname, 'priorityUsers.json');
const allRegisteredUsersFile = path.resolve(__dirname, 'registeredUsers.json');

// Function to read priority users from the JSON file
function readPriorityUsers() {
  if (fs.existsSync(priorityUsersFile)) {
    const data = fs.readFileSync(priorityUsersFile, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

// Function to read all registered users from the JSON file
function readAllRegisteredUsers() {
  if (fs.existsSync(allRegisteredUsersFile)) {
    const data = fs.readFileSync(allRegisteredUsersFile, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('список_неприоритетов')
    .setDescription('Показывает список неприоритетных пользователей'),

  async execute(interaction) {


    const priorityUsers = readPriorityUsers();
    const allRegisteredUsers = readAllRegisteredUsers();

    const nonPriorityUsers = allRegisteredUsers.filter(userId => !priorityUsers.includes(userId));

    if (nonPriorityUsers.length === 0) {
      return interaction.reply({ content: 'Нет неприоритетных пользователей.', ephemeral: true });
    }

    const userList = nonPriorityUsers.map(userId => `<@${userId}>`).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Неприоритетные пользователи')
      .setDescription(userList)
      .setTimestamp(new Date());

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
