const dotenv = require('dotenv');

const { Telegraf } = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const WizardScene = require('telegraf/scenes/wizard');
const Extra = require('telegraf/extra');

const mongoose = require('mongoose');

const Student = require('./models/Student');
const Code = require('./models/Code');
const Question = require('./models/Question');

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

const answerWizard = new WizardScene(
  'answer-wizard',
  (ctx) => {
    ctx.reply('Digite o numero da questão');
    ctx.wizard.state.data = {};
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.data.number = ctx.message.text;

    const question = await Question.findOne({
      number: ctx.wizard.state.data.number,
    });
    if (!question) {
      ctx.reply(`Questão inválida!🙃`);
      return ctx.scene.leave();
    }
    ctx.wizard.state.data.question = question;
    ctx.reply('Digite a resposta da pergunta');
    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.data.userAnswer = ctx.message.text;

    if (
      ctx.wizard.state.data.userAnswer.toLowerCase() !=
      ctx.wizard.state.data.question.answer.toLowerCase()
    ) {
      ctx.reply('Infelizmente a resposta está errada, tente novamente! 🥵');
    } else {
      student = await Student.findOne({
        chat_id: ctx.update.message.chat.id,
      });

      if (student.answered_questions.includes(ctx.wizard.state.data.number)) {
        ctx.reply('Você já respondeu essa pergunta!');
      } else {
        student.answered_questions.push(ctx.wizard.state.data.number);
        student.save();
        ctx.reply('Parabéns!!!🥳 Resposta correta!');
      }
    }

    return ctx.scene.leave();
  }
);

const createQuestionWizard = new WizardScene(
  'create-question-wizard',
  (ctx) => {
    const questionArray = ctx.update.message.text.split(' ');
    questionArray.shift();

    ctx.wizard.state.data = {};
    const questionNumber = questionArray.join(' ');
    if (questionNumber.trim() == '') {
      ctx.reply(`Digite um código válido 😬`);
      return ctx.scene.leave();
    }
    ctx.wizard.state.data.number = questionNumber;
    ctx.reply('Digite a url da imagem');
    return ctx.wizard.next();
  },
  (ctx) => {
    ctx.wizard.state.data.question = ctx.message.text;
    ctx.reply('Digite a resposta da pergunta');

    return ctx.wizard.next();
  },
  async (ctx) => {
    ctx.wizard.state.data.answer = ctx.message.text;

    try {
      const createdQuestion = await Question.create({
        number: ctx.wizard.state.data.number,
        question: ctx.wizard.state.data.question,
        answer: ctx.wizard.state.data.answer,
      });
      console.log(createdQuestion);

      ctx.reply('Questão criada com sucesso!🤩');
    } catch (err) {
      ctx.reply('Erro ao criar a questão ;-;');
    }

    return ctx.scene.leave();
  }
);

const stage = new Stage([codeWizard, answerWizard, createQuestionWizard]);

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.catch((err, ctx) => {
  console.log(err);
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
bot.command('responder', async (ctx) => {
  ctx.scene.enter('answer-wizard');
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

bot.command('createquestion', (ctx) => {
  ctx.scene.enter('create-question-wizard');
});

bot.command('sendquestion', async (ctx) => {
  const questionArray = ctx.update.message.text.split(' ');
  questionArray.shift();

  const questionNumber = questionArray.join(' ');
  if (questionNumber.trim() == '') {
    return ctx.reply(`Digite uma pergunta válida`);
  }

  const question = await Question.findOne({ number: questionNumber });
  if (!question) {
    return ctx.reply(`Digite uma pergunta válida`);
  }

  console.log(question);

  const studentsList = await Student.find({});

  ctx.reply(
    `Enviando a mensagem para todos os ${studentsList.length} usuários cadastrados `
  );

  studentsList.forEach((student) => {
    ctx.telegram.sendPhoto(
      student.chat_id,
      question.question,
      Extra.caption(`ATENÇÃO: Pergunta número ${question.number}`)
    );
  });
});
//admin commands end

bot.launch();
