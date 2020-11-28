const dotenv = require('dotenv');
const { Telegraf } = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const WizardScene = require('telegraf/scenes/wizard');
const mongoose = require('mongoose');
const Student = require('./models/Student');
const Code = require('./models/Code');

dotenv.config();

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// const stage = new Stage([statusWizard]);

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());
// bot.use(stage.middleware());

bot.start(async (ctx) => {
  let student;
  try {
    student = await Student.create({
      chat_id: ctx.update.message.chat.id,
      first_name: ctx.update.message.chat.first_name,
    });
  } catch (err) {
    student = await Student.findOne({
      chat_id: ctx.update.message.chat.id,
    });
  }
  console.log(ctx.update.message.chat);
  return ctx.reply(
    `Bem vindo à XV Semana da Tecnologia, ${student.first_name} 🚀\n\n Comandos:\n - /responder : Responder uma das questões `
  );
});

//comandos de admin
bot.command('sendstall', async (ctx) => {
  const messageArray = ctx.update.message.text.split(' ');
  messageArray.shift();

  const message = messageArray.join(' ');
  if (message.trim() == '') {
    return ctx.reply(`Digite uma mensagem válida`);
  }

  console.log(`sending for all users: ${message}`);

  const studentsList = await Student.find({});

  ctx.reply(
    `Enviando a mensagem para todos os ${studentsList.length} usuários cadastrados `
  );

  studentsList.forEach((student) => {
    ctx.telegram.sendMessage(student.chat_id, message);
  });
});

bot.command('createcode', async (ctx) => {
  const codeArray = ctx.update.message.text.split(' ');
  codeArray.shift();

  const code = codeArray.join(' ');
  if (code.trim() == '') {
    return ctx.reply(`Digite um código válido 😬`);
  }

  const createdCode = await Code.create({
    code,
  });

  return ctx.reply(`Código criado com sucesso!✅\nCódigo: ${createdCode.code}`);
});
//fim comandos de admin

bot.launch();
