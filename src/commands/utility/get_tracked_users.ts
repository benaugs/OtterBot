import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import path from 'node:path';
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const trackedUsersFile = path.resolve(__dirname, 'trackedUsers.json');

type TrackedDay = {
  attempted: string[];
  succeeded: string[];
}

function readTrackedUsers(): Record<string, TrackedDay> {
  if (fs.existsSync(trackedUsersFile)) {
    const data = fs.readFileSync(trackedUsersFile, 'utf-8');
    return JSON.parse(data);
  }

  return {};
}

function getStartOfMonth() {
  return new Date().toISOString().slice(0, 8) + '01';
}

function getToday() {
  return new Date();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('таблица_посещаемости')
    .setDescription('Показывает список посещаемости, можно указать промежуток')
    .addStringOption(option =>
      option.setName('начало_промежутка')
        .setDescription('Начало промежутка в формате YYYY-MM-DD')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('конец_промежутка')
        .setDescription('Конец промежутка в формате YYYY-MM-DD')
        .setRequired(false)
    ),

  async execute(interaction) {
    const trackedUsers = readTrackedUsers();

    const startDate = interaction.options.getString('начало_промежутка') || getStartOfMonth();
    const endDate = interaction.options.getString('конец_промежутка') || getToday().toISOString().split('T')[0];

    const attemptCount = {};
    const successCount = {};

    for (const [date, record] of Object.entries(trackedUsers)) {
      if (date >= startDate && date <= endDate) {
        record.attempted.forEach(userId => {
          attemptCount[userId] = (attemptCount[userId] || 0) + 1;
        });

        record.succeeded.forEach(userId => {
          successCount[userId] = (successCount[userId] || 0) + 1;
        });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Статистика посещений')
      .setDescription(`Статистика от ${startDate} по ${endDate}`);

    const fields = [];

    const allUserIds = new Set([...Object.keys(attemptCount), ...Object.keys(successCount)]);

    const userStats = Array.from(allUserIds).map(userId => {
      const attempts = attemptCount[userId] || 0;
      const successes = successCount[userId] || 0;
      return {
        user: `<@${userId}>`,
        attempts: attempts.toString(),
        successes: successes.toString()
      };
    });

    fields.push(
      {
        name: 'Дискорд ник',
        value: userStats.map(stat => stat.user).join('\n') || '-',
        inline: true
      },
      {
        name: 'Регистраций',
        value: userStats.map(stat => stat.attempts).join('\n') || '-',
        inline: true
      },
      {
        name: 'Участий',
        value: userStats.map(stat => stat.successes).join('\n') || '-',
        inline: true
      }
    );

    embed.addFields(fields);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
