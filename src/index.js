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

const codeWizard = new WizardScene(
  'code-wizard',
  (ctx) => {
    ctx.reply('Digite o código');
    ctx.wizard.state.data = {};
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.data.code = ctx.message.text;

    const code = await Code.findOne({ code: ctx.wizard.state.data.code });

    if (code) {
      student = await Student.findOne({
        chat_id: ctx.update.message.chat.id,
      });
      if (student.submited_codes.includes(ctx.wizard.state.data.code)) {
        ctx.reply('Você já usou esse código uma vez!🥴');
      } else {
        student.submited_codes.push(ctx.wizard.state.data.code);
        student.save();
        ctx.reply('Código cadastrado com sucesso!🤩');
      }
      console.log(student);
    } else {
      ctx.reply('Código inválido!🥺');
    }

    return ctx.scene.leave();
  }
);
const stage = new Stage([codeWizard]);

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.catch((err, ctx) => {
  // console.log(err);
  ctx.reply('Esse não é um comando válido!😬');
});
bot.use(session());
bot.use(stage.middleware());

//user commands begin
bot.start(async (ctx) => {
  let student;
  try {
    student = await Student.create({
      chat_id: ctx.update.message.chat.id,
      first_name: ctx.update.message.chat.first_name,
    });
    console.log('Novo usuário', ctx.update.message.chat);
  } catch (err) {
    student = await Student.findOne({
      chat_id: ctx.update.message.chat.id,
    });
  }
  return ctx.reply(
    `Bem vindo à XV Semana da Tecnologia, ${student.first_name} 🚀\n\n Comandos:\n - /responder : Responder uma das questões\n - /codigo : Usar um código\n`
  );
});

bot.command('codigo', async (ctx) => {
  ctx.scene.enter('code-wizard');
});
//user commands end

//admin commands begin
bot.command('sendall', async (ctx) => {
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

  try {
    var createdCode = await Code.create({
      code,
    });
  } catch (err) {
    return ctx.reply(`Esse código já existe🤭`);
  }

  return ctx.reply(`Código criado com sucesso!✅\nCódigo: ${createdCode.code}`);
});

bot.command('removecode', async (ctx) => {
  const codeArray = ctx.update.message.text.split(' ');
  codeArray.shift();

  const code = codeArray.join(' ');
  if (code.trim() == '') {
    return ctx.reply(`Digite um código válido 😬`);
  }

  const deletedCode = await Code.deleteOne({ code });
  console.log(deletedCode);
  if (deletedCode.deletedCount) {
    return ctx.reply('Código removido com sucesso!✅');
  }
  return ctx.reply('Código não encontrado! :(');
});
//admin commands end

bot.launch();
