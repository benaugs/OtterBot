import { SlashCommandBuilder, EmbedBuilder, StartThreadOptions } from 'discord.js';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';
import { minutesToMilliseconds } from '../../utils.js';

const noParticipant = 'Участников нет';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pingRoleId = process.env.PING_ROLE_ID

const roles = ['шая', 'валькирия', 'волшебник', 'мдд', 'рдд', 'дрг', 'рл', 'фри'];
const channels = ['Кальфеон-Камасильвия', 'Медия-Валенсия', 'Баленос-Серендия', 'Кама-1', 'Кальф-1', 'Б-1', 'C-1', 'В-1', 'M-1'];

const previousRegistrationFile = path.resolve(__dirname, 'registeredUsers.json');
const priorityUsersFile = path.resolve(__dirname, 'priorityUsers.json');
const trackedUsersFile = path.resolve(__dirname, 'trackedUsers.json');

if (!fs.existsSync(previousRegistrationFile)) {
  fs.writeFileSync(previousRegistrationFile, JSON.stringify([]));
}

if (!fs.existsSync(priorityUsersFile)) {
  fs.writeFileSync(priorityUsersFile, JSON.stringify([]));
}

if (!fs.existsSync(trackedUsersFile)) {
  fs.writeFileSync(trackedUsersFile, JSON.stringify({}));
}

function formatFields(oldFields, newFields) {
  const labelMap = new Map();
  const fields = [];

  // Create a mapping from person ID to label from OLD_FIELDS
  const personToLabelMap = {};
  oldFields.forEach(field => {
    field.people.forEach(person => {
      personToLabelMap[person] = field.label;
    });
  });

  // Add the label to each person in NEW_FIELDS
  newFields.forEach(field => {
    field.people.forEach(person => {
      const label = personToLabelMap[person];
      if (label) {
        if (!labelMap.has(label)) {
          labelMap.set(label, []);
        }
        labelMap.get(label).push(person);
      }
    });
  });

  Array.from(labelMap.keys()).forEach((label, index) => {
    const people = labelMap.get(label)

    fields.push({
      name: `${index + 1}. ${label} (${people.length})`,
      value: `${people.map((id) => `<@${id}>`).join(', ')}`,
      inline: false,
      people,
      label,
    })
  })

  return fields;
}

function getRandomElements(array, count, previousRegistration = [], priorityUsers = []) {
  const priority = array.filter(user => priorityUsers.includes(user));
  const previous = array.filter(user => !priorityUsers.includes(user) && previousRegistration.includes(user));
  const remaining = array.filter(user => !priorityUsers.includes(user) && !previousRegistration.includes(user));

  const shuffledPriority = priority.slice(0);
  const shuffledPrevious = previous.slice(0);
  const shuffledRemaining = remaining.slice(0);

  const shuffle = (arr) => {
    let i = arr.length;
    while (i) {
      const j = Math.floor(Math.random() * i--);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  shuffle(shuffledPriority);
  shuffle(shuffledPrevious);
  shuffle(shuffledRemaining);

  const result = [...shuffledPriority, ...shuffledRemaining, ...shuffledPrevious].slice(0, count);

  return result;
}

function readPriorityUsers() {
  if (fs.existsSync(priorityUsersFile)) {
    const data = fs.readFileSync(priorityUsersFile, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

function readPreviousRegistration() {
  if (fs.existsSync(previousRegistrationFile)) {
    const data = fs.readFileSync(previousRegistrationFile, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

function readTrackedUsers() {
  if (fs.existsSync(trackedUsersFile)) {
    const data = fs.readFileSync(trackedUsersFile, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

function writeCurrentRegistration(currentRegistration) {
  const data = JSON.stringify(currentRegistration, null, 2);
  fs.writeFileSync(previousRegistrationFile, data, 'utf-8');
}

function writeTrackedUsers(trackedData) {
  const data = JSON.stringify(trackedData, null, 2);
  fs.writeFileSync(trackedUsersFile, data, 'utf-8');
}

const command =  new SlashCommandBuilder()
  .setName('осада')
  .setDescription('Создаёт регу на осаду')
  .addStringOption((option) => {
    option.setName('канал')
    option.setDescription('Установить канал осады')
    option.setRequired(true)
    option.setChoices(channels.map((channel) => ({ name: channel, value: channel})))

    return option
  })
  .addNumberOption((option) =>
    option.setName('таймер')
      .setDescription('Таймер завершение регистрации в минутах, по дефолту 20 мин')
      .setMinValue(1)
  ).addBooleanOption((option) =>
    option.setName('обновить_неприоритет')
      .setDescription('Менять список не-приоритета, спиоск людей которые попали на предыдущую осаду, по дефолту да')
  ).addBooleanOption((option) =>
    option.setName('обновить_посещаемость')
      .setDescription('Будет ли учитываться эта осада в посещаемости, по дефолту да')
  )




roles.forEach((elem) => {
  command.addNumberOption((option) =>
    option.setName(elem)
      .setMinValue(1)
      .setDescription(`Кол-во людей для роли: ${elem.toUpperCase()}`)
  )
})

function trackAttempts(attempted: string[], succeeded: string[]) {
  const trackedData = readTrackedUsers();
  const isoDate = new Date().toISOString().split('T')[0];

  trackedData[isoDate] = { attempted, succeeded };
  writeTrackedUsers(trackedData);
}

module.exports = {
  data: command,

  async execute(interaction) {
    const channel = interaction.options.getString('канал');
    const timer = interaction.options.getString('таймер') || 20;
    const trackUsers = interaction.options.getBoolean('обновить_посещаемость') ?? true;
    const editPriorUserList = interaction.options.getBoolean('обновить_неприоритет') ?? true;

    const discrodChannel = interaction.channel;

    const formattedRole = roles.reduce((acc, name) => {
      const value = interaction.options.getNumber(name);

      if (value) {
        acc.push({
          value,
          name: name.toUpperCase(),
        });
      }
      return acc;
    }, []);

    const fields = formattedRole.map((role, currentIndex) => ({
      name: `${currentIndex + 1}. ${role.name} (0/${role.value})`,
      value: noParticipant,
      inline: false,
      people: [],
      count: role.value,
      label: role.name
    }));

    const timerEnd = new Date();
    timerEnd.setMinutes(timerEnd.getMinutes() + timer);
    const timestamp = Math.floor(timerEnd.getTime() / 1000);


    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`Осада ${channel}`)
      .setDescription(`Регистрация закроется  <t:${timestamp}:R>`)
      .addFields(fields)
      .setTimestamp(new Date())
      .setThumbnail('https://media.discordapp.net/attachments/1346806477800869898/1356664996997628085/bot.png?ex=67ed643c&is=67ec12bc&hm=437010e64024649ba8a6177c9a854bc4162289b62f98ed9da2ccdbd61b672375&=&format=webp&quality=lossless')

    await discrodChannel.send(`<@&${pingRoleId}>`);
    const message = await interaction.reply({ embeds: [embed], fetchReply: true });


    const thread = await message.startThread({
      name: 'Осада Discussion',
      autoArchiveDuration: 60,
    } as StartThreadOptions);

    console.log(`Thread created with ID: ${thread.id}`);

    const filter = m => !m.author.bot;
    const collector = thread.createMessageCollector({ filter, time: minutesToMilliseconds(timer) });

    collector.on('collect', async msg => {
      const inputNumber = Number(msg.content);
      if (isNaN(inputNumber) || inputNumber < 1 || inputNumber > fields.length) {
        return;
      }

      let userSameSlot = false;

      fields.forEach((field, idx) => {
        const index = field.people.indexOf(msg.author.id);
        if (index > -1) {
          if (idx === inputNumber - 1) {
            userSameSlot = true;
            field.people.splice(index, 1);
          } else {
            field.people.splice(index, 1);
          }
          if (field.people.length === 0) {
            field.value = noParticipant;
          } else {
            field.value = field.people.map(userId => `<@${userId}>`).join(', ');
          }
          field.name = `${idx + 1}. ${field.label}(${field.people.length}/${field.count})`;
        }
      });

      if (!userSameSlot) {
        const { count, label, people } = fields[inputNumber - 1];
        people.push(msg.author.id);  // Use ID for pinging
        fields[inputNumber - 1].value = people.map(userId => `<@${userId}>`).join(', ');
        fields[inputNumber - 1].name = `${inputNumber}. ${label}(${people.length}/${count})`;
      }

      embed.setFields(fields);

      await message.edit({ embeds: [embed] });
    });

    collector.on('end', async () => {


      try {
          const previousRegistration = readPreviousRegistration();
          const priorityUsers = readPriorityUsers();
          await thread.setLocked(true);
          await thread.setArchived(true);

          const clonnedFields = JSON.parse(JSON.stringify(fields));


          const remainingUsers = [];
          fields.forEach(field => {
            if (field.people.length > field.count) {
              const selected = getRandomElements(field.people, field.count, previousRegistration, priorityUsers);
              const overflow = field.people.filter(userId => !selected.includes(userId));
              field.people = selected;
              if (field.label !== 'ШАЯ') {
                remainingUsers.push(...overflow);
              }
            }
            field.value = field.people.length === 0 ? noParticipant : field.people.map(userId => `<@${userId}>`).join(', ');
            field.name = `${fields.indexOf(field) + 1}. ${field.label}(${field.people.length}/${field.count})`;
          });

          remainingUsers.forEach((userId) => {
            let assigned = false;
            for (const field of fields) {
              if (field.label !== 'ШАЯ' && field.people.length < field.count) {
                field.people.push(userId);
                field.value = field.people.map((uid) => `<@${uid}>`).join(', ');
                field.name = `${fields.indexOf(field) + 1}. ${field.label}(${field.people.length}/${field.count})`;
                assigned = true;
                break;
              }
            }
            if (!assigned) {
              for (const field of fields) {
                if (
                  field.label === 'ШАЯ' &&
                  field.people.length < field.count
                ) {
                  field.people.push(userId);
                  field.value = field.people
                    .map((uid) => `<@${uid}>`)
                    .join(', ');
                  field.name = `${fields.indexOf(field) + 1}. ${field.label}(${field.people.length}/${field.count})`;
                  break;
                }
              }
            }
          });

          const newFields = formatFields(clonnedFields, fields);

          const currentRegistration =  newFields
            .flatMap(item => item.people)
            .filter(person => !priorityUsers.includes(person));

          embed.setDescription('Регистрация закрыта');
          embed.setFields(newFields);
          await message.edit({ embeds: [embed] });

          const attemptedUsers: string[] = clonnedFields.reduce((acc, { people }) => [...acc, ...people], []);

          if(trackUsers) {
            trackAttempts(attemptedUsers, currentRegistration);
          }

          if(editPriorUserList) {
            writeCurrentRegistration(currentRegistration);
          }

      } catch (e) {
        console.log(e)
      }
    });
  }
};
