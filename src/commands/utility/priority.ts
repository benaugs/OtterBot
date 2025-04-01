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

function writePriorityUsers(priorityUsers) {
  const data = JSON.stringify(priorityUsers, null, 2);
  fs.writeFileSync(priorityUsersFile, data, 'utf-8');
}

function writeNonPriorityUsers(nonPriorityUsers) {
  const data = JSON.stringify(nonPriorityUsers, null, 2);
  fs.writeFileSync(nonPriorityUsersFile, data, 'utf-8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('приоритет')
    .setDescription('Добавляет пользователей в приоритетный список, что бы они всегда попадали на осаду')
    .addUserOption((option) =>
      option.setName('пользователь')
        .setDescription('Пользователь для добавления в приоритетный список')
        .setRequired(true)
    ),
  async execute(interaction) {


    const user = interaction.options.getUser('пользователь');

    const priorityUsers = readPriorityUsers();
    let nonPriorityUsers = readNonPriorityUsers();

    if (priorityUsers.includes(user.id)) {
      return interaction.reply({ content: 'Этот пользователь уже в приоритетном списке.', ephemeral: true });
    }

    if (nonPriorityUsers.includes(user.id)) {
      nonPriorityUsers = nonPriorityUsers.filter(userId => userId !== user.id);
      writeNonPriorityUsers(nonPriorityUsers);
    }

    priorityUsers.push(user.id);
    writePriorityUsers(priorityUsers);

    return interaction.reply({ content: `Пользователь ${user.tag} добавлен в приоритетный список.`, ephemeral: true });
  }
};
