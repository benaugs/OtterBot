import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nonPriorityUsersFile = path.resolve(__dirname, 'registeredUsers.json');

function readNonPriorityUsers() {
  if (fs.existsSync(nonPriorityUsersFile)) {
    const data = fs.readFileSync(nonPriorityUsersFile, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

function writeNonPriorityUsers(nonPriorityUsers) {
  const data = JSON.stringify(nonPriorityUsers, null, 2);
  fs.writeFileSync(nonPriorityUsersFile, data, 'utf-8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('удалить_неприоритет')
    .setDescription('Удаляет пользователей из списка неприоритетных пользователей')
    .addUserOption((option) =>
      option.setName('пользователь')
        .setDescription('Пользователь для удаления из списка неприоритетных пользователей')
        .setRequired(true)
    ),
  async execute(interaction) {


    const user = interaction.options.getUser('пользователь');

    let nonPriorityUsers = readNonPriorityUsers();

    if (!nonPriorityUsers.includes(user.id)) {
      return interaction.reply({ content: 'Этот пользователь не в списке неприоритетных пользователей.', ephemeral: true });
    }

    nonPriorityUsers = nonPriorityUsers.filter(userId => userId !== user.id);
    writeNonPriorityUsers(nonPriorityUsers);

    return interaction.reply({ content: `Пользователь ${user.tag} удален из списка неприоритетных пользователей.`, ephemeral: true });
  }
};
