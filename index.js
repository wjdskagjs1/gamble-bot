const Discord = require('discord.js');
const config = require('./config.json');
const fs = require('fs');
const article = fs.readFileSync("README.md").toString();
const client = new Discord.Client();
let score = require('./score.json');
let game = require('./game.json');
const init = async (name, msg) => {
    if(game[name] === undefined){
        game[name] = {
            "state":"end",
            "gain": 1,
            "answer": 0
        }
    }
    game[name].state = "start";
    game[name].answer = Math.floor( Math.random() * 2 + 1 ); //1또는 2 
    const embed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('홀or짝?')
    .setAuthor(name)
    .setDescription('1️⃣ : 홀\n2️⃣ : 짝');

    msg.channel.send(embed)
    .then((message)=>{
        message.react('1️⃣');
        message.react('2️⃣');
    });
    await fs.writeFile('./game.json', JSON.stringify(game), 'utf8', function(err) {
        console.log('비동기적 파일 쓰기 완료');
    });
};
const next = async (name, msg) => {
    game[name].state = "start";
    game[name].gain *= 2; 
    game[name].answer = Math.floor( Math.random() * 2 + 1 ); //1또는 2 

    const embed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('홀or짝?')
    .setAuthor(name)
    .setDescription('1️⃣ : 홀\n2️⃣ : 짝');

    msg.channel.send(embed)
    .then((message)=>{
        message.react('1️⃣');
        message.react('2️⃣');
    });
    await fs.writeFile('./game.json', JSON.stringify(game), 'utf8', function(err) {
        console.log('비동기적 파일 쓰기 완료');
    });
};
const end = async (name, msg, win) => {
    if(score[name] === undefined){
        score[name] = 0;
    }
    let str = "수고하셨시유~.";
    if(win){
       str += ` (총점:${score[name]}+${game[name].gain}=${score[name]+game[name].gain})`;
       (await function(){score[name] += game[name].gain})();
    }
    msg.channel.send(str);
    
    await fs.writeFile('./score.json', JSON.stringify(score), 'utf8', function(err) {
        console.log('비동기적 파일 쓰기 완료');
    });

    game[name].gain = 1;
    game[name].answer = 0; 
    
    game[name].state = "end";
    await fs.writeFile('./game.json', JSON.stringify(game), 'utf8', function(err) {
        console.log('비동기적 파일 쓰기 완료');
    });
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    
    if (msg.author.bot) return;

    if (msg.content === '$help') {
        msg.channel.send("\`\`\`"+article+"\`\`\`");
    }
    if (msg.content === '$rank') {
        const rank = Object.entries(score).sort((a,b) => a[1] - b[1])
        for (let [key, value] of rank) {
            let str = "";
            str += `${key} : ${value}점\n`;
            msg.channel.send("총점 랭킹입니다.\n"+"\`\`\`"+str+"\`\`\`");
        }
    }
    if (msg.content === '$start') {
        init(msg.author.username, msg);
    }
});

client.on('messageReactionAdd', (messageReaction, user)=>{
    if (user.bot) return;
    const odd = (messageReaction, user)=>{
        const num = Math.floor( Math.random() * 4 + 1) * 2 - 1;
        const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('홀!')
        .setAuthor(user.username)
        .setDescription(`개수 : ${num}`);
        messageReaction.message.channel.send(embed);
    }
    const even = (messageReaction, user)=>{
        const num = Math.floor( Math.random() * 4 + 1) * 2;
        const embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle('짝!')
        .setAuthor(user.username)
        .setDescription(`개수 : ${num}`);
        messageReaction.message.channel.send(embed);
    }

    if(messageReaction.emoji.name === '1️⃣' && game[user.username].state === "start"){
        if(game[user.username].answer === 1){
            odd(messageReaction, user);
            game[user.username].state = "choose";
            messageReaction.message.channel.send("홀수네유. 축하드려유~.");
            messageReaction.message.channel.send("묻고 더블로 갈까유?")
            .then((message)=>{
                message.react('⭕');
                message.react('❌');
            });
        }
        if(game[user.username].answer === 2){
            even(messageReaction, user);
            messageReaction.message.channel.send("아쉽네유~.");
            end(user.username, messageReaction.message, false);
        }
    }

    if(messageReaction.emoji.name === '2️⃣' && game[user.username].state === "start"){
        if(game[user.username].answer === 2){
            even(messageReaction, user);
            messageReaction.message.channel.send("짝수네유. 축하드려유~.");
            messageReaction.message.channel.send("묻고 더블로 갈까유?")
            .then((message)=>{
                message.react('⭕')
                message.react('❌');
            });
        }
        if(game[user.username].answer === 1){
            odd(messageReaction, user);
            messageReaction.message.channel.send("아쉽네유~.");
            end(user.username, messageReaction.message, false);
        }
    }
    if(messageReaction.emoji.name === '⭕' && game[user.username].state === "choose"){
        next(user.username, messageReaction.message);
    }
    if(messageReaction.emoji.name === '❌' && game[user.username].state === "choose"){
        end(user.username, messageReaction.message, true);
    }
});

client.login(config.token);