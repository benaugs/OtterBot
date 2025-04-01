import { SlashCommandBuilder } from 'discord.js';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const priorityUsersFile = path.resolve(__dirname, 'priorityUsers.json');
const nonPriorityUsersFile = path.resolve(__dirname, 'registeredUsers.json');

// Initialize files if not present
if (!fs.existsSync(priorityUsersFile)) {
  fs.writeFileSync(priorityUsersFile, JSON.stringify([]));
}

if (!fs.existsSync(nonPriorityUsersFile)) {
  fs.writeFileSync(nonPriorityUsersFile, JSON.stringify([]));
}

function readPriorityUsers() {
  if (fs.existsSync(priorityUsersFile)) {
    const data = fs.readFileSync(priorityUsersFile, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

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
    .setName('добавить_неприоритет')
    .setDescription('Добавляет пользователей в список неприоритетных пользователей')
    .addUserOption((option) =>
      option.setName('пользователь')
        .setDescription('Пользователь для добавления в список неприоритетных пользователей')
        .setRequired(true)
    ),
  async execute(interaction) {


    const user = interaction.options.getUser('пользователь');

    const priorityUsers = readPriorityUsers();
    const nonPriorityUsers = readNonPriorityUsers();

    if (nonPriorityUsers.includes(user.id)) {
      return interaction.reply({ content: 'Этот пользователь уже в списке неприоритетных пользователей.', ephemeral: true });
    }

    if (priorityUsers.includes(user.id)) {
      return interaction.reply({ content: 'Этот пользователь находится в приоритетном списке. Удалите его из этого списка, чтобы добавить в список неприоритетных пользователей.', ephemeral: true });
    }

    nonPriorityUsers.push(user.id);
    writeNonPriorityUsers(nonPriorityUsers);

    return interaction.reply({ content: `Пользователь ${user.tag} добавлен в список неприоритетных пользователей.`, ephemeral: true });
  }
};
