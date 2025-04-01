import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const priorityUsersFile = path.resolve(__dirname, 'priorityUsers.json');

function readPriorityUsers() {
  if (fs.existsSync(priorityUsersFile)) {
    const data = fs.readFileSync(priorityUsersFile, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

function writePriorityUsers(priorityUsers) {
  const data = JSON.stringify(priorityUsers, null, 2);
  fs.writeFileSync(priorityUsersFile, data, 'utf-8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('удалить_приоритет')
    .setDescription('Удаляет пользователей из приоритетного списка')
    .addUserOption((option) =>
      option.setName('пользователь')
        .setDescription('Пользователь для удаления из приоритетного списка')
        .setRequired(true)
    ),
  async execute(interaction) {


    const user = interaction.options.getUser('пользователь');

    let priorityUsers = readPriorityUsers();

    if (!priorityUsers.includes(user.id)) {
      return interaction.reply({ content: 'Этот пользователь не в приоритетном списке.', ephemeral: true });
    }

    priorityUsers = priorityUsers.filter(userId => userId !== user.id);
    writePriorityUsers(priorityUsers);

    return interaction.reply({ content: `Пользователь ${user.tag} удален из приоритетного списка.`, ephemeral: true });
  }
};
