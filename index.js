const fs = require('node:fs');
const path = require('node:path');
const { channel } = require("diagnostics_channel");
const { Client, Collection, Events, GatewayIntentBits } = require("discord.js");
const { truncate } = require("fs");
require("dotenv/config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION", "USER"],
});

// Get save state from json file
const { writeFile } = require("fs");
var data = require("./challenge-data.json");

// Initial Parameters
var stepCount = data["stepCount"];
var starsCount = data["starsCount"];

var stepGoal = 800000;
var starGoal = 5000;
const PREFIX = "!steps";
const messageChannelID = process.env.ChannelID
const CookieBunnyID = process.env.CookieBunnyID


client.on("ready", () => {
  console.log("The bot is ready");
});
                        
function printProgressBar(stepCount, starsCount, user = 0, reaction = 0, message = 0) {

  let precentage = Math.round((stepCount / stepGoal) * 100);
  let equalCount = Math.round(precentage / 5);
  if (precentage > 50 && precentage < 100) {
    equalCount -= 10;
  } else if (precentage >= 100) {
    equalCount = 10;
  }
  
  let equalString = "=".repeat(equalCount);
  let spaceCount = 10 - equalCount;
  let spaceString = " ".repeat(spaceCount);

  stars = "⭐ x" + starsCount;

  let progressMessage = ""
  let startMessage = ""

  if (reaction == 0) {
    progressMessage = message
  } else {
    progressMessage = reaction.message
    startMessage = "nice work " + reaction.message.author.username + "!! \n"
  }

  if (precentage <= 50) {
    progressMessage.reply(startMessage + "`[" + equalString + spaceString + " " + String(precentage) + "%           ]  " + String(stepCount) + "/" + String(stepGoal) + "`\n" + String(stars));
  } else if (precentage > 50 && precentage < 100) {
    progressMessage.reply(startMessage + "`[========== " + String(precentage) + "% " + equalString + spaceString + "]  " + String(stepCount) + "/" + String(stepGoal) + "`\n" + String(stars));
  } else {
    progressMessage.reply("challenge completed!!!!  \n`[========== 100% ==========]  " + String(stepCount) + "/" + String(stepGoal) + "`\n" + String(stars));
  }

}



client.on("messageReactionAdd", (reaction, user) => {


  if (reaction.message.channel.id != messageChannelID && messageChannelID) {
    return;
  }

  // This is true when the bot has reacted to the emoji that was added
  if (reaction.me) {
    return;
  }

  if (reaction.emoji.name != "👍") {
    return;
  }

  if (!reaction.message.content.toLowerCase().startsWith(PREFIX)) {
    return;
  }

  // const guild = reaction.message.guild;
  // const guildMembers = guild.members;
  // const guildMember = guildMembers.cache.get(user.id);

  //let isAdministrator = guildMember.roles.cache.some((role) => role.name === "Administrator")

  if (user.id != CookieBunnyID) {
    return;
  }

  // Parse the message
  const parts = reaction.message.content
    .split(" ")
    .map((s) => s.trim())
    .filter((s) => s);
  
  if (parts.length < 2) {
    return;
  }

  const commandName = parts[1].replace(",", "");

  if (!isNaN(commandName)){
    stepCount = stepCount + Math.round(Number(commandName));

    if (Number(commandName) > starGoal) {
      starsCount++;
    }

    data["stepCount"] = stepCount
    data["starsCount"] = starsCount

    const JsonFileStream = fs.createWriteStream("./challenge-data.json")

    //JSON.striginfy makes the object into a string, `null, 6` makes it prettier
    JsonFileStream.write(JSON.stringify(data, null, 6), err => {
      if(err) console.error(err);
    })

    reaction.message.react("👍");

  } else if (commandName == "add") {
    // e.g. !steps add 500
    if (!isNaN(parts[2])){
      stepCount += Math.round(Number(parts[2]));
    }

    if (!isNaN(parts[3])){
      starsCount += Math.round(Number(parts[3]));
    }

  } else if (commandName == "remove") {
    // e.g. !steps remove 500
    if (!isNaN(parts[2])) {
      stepCount -= Math.round(Number(parts[2]));
      
      if (stepCount < 0) {
        stepCount = 0;
      }
    }

    if (!isNaN(parts[3])) {
      starsCount -= Math.round(Number(parts[3]));

      if (starsCount < 0) {
        starsCount = 0;
      }
    }
  }

  printProgressBar(stepCount, starsCount, user, reaction, undefined);


});


client.on("messageCreate", (message) => {

  // !buh
  if (message.content == "buh") {
    let numberOfBuh = Math.floor(Math.random() * 5) + 1;
    message.channel.send("buh! ".repeat(numberOfBuh));
  }

  if (message.channel.id != messageChannelID) {
    return;
  }

  // Ignore any message that doesn't start with !steps
  if (!message.content.toLowerCase().startsWith(PREFIX)) {
    return;
  }

  // Parse the command
  const parts = message.content
    .split(" ")
    .map((s) => s.trim())
    .filter((s) => s);

  // !steps
  // Post the details of the steps challenge
  if (message.content == PREFIX) {
    message.reply(
      "**Steps Challenge:** Reach 300,000 steps as a community!!" +
        "\nChallenge runs for one week from February 1st to 7th." +
        "\n" +
        "\nOnce a day, in the steps discord channel, submit steps by typing the command `!steps` followed by the number of steps you took!    e.g. `!steps 3400`" +
        "\nInclude a screenshot of an app that shows the number of steps you took so that it can be validated." +
        "\nA submission more than **5000 steps** receives a gold star! ⭐😮" +
        "\n" +
        "\nType `!steps progress` to see the current total steps progress bar." +
        "\nSubmit steps for either the previous day or current day." +
        "\nOnce it is validated it'll be added to the community total! 😊" +
        "\n" +
        "\nIf 300K is reached, a donation of $100 will be made at ESA Winter!!" +
        "\nAdditionally, if we reach **35 stars**, this will be an additional $100 donation!! 🥳" +
        "\nHave fun, Good luck! Share pics of your walking adventures!"
    );
    return;
  }

  // User gives a command
  const commandName = parts[1].replace(",", "");

  // !steps ping
  // Play ping pong with the Bot
  if (commandName == "ping") {
    message.channel.send("pong");
  }

  // !steps 300
  // If the command is a number
  if (!isNaN(commandName)) {
    if (Number(commandName) < 0) {
      message.reply("no negative stepping 😠");
      return
    }
    message.reply("submission received! 😊 waiting for validation...");
  }

  // !steps progress
  // Show the current progress
  if (commandName == "progress") {
    printProgressBar(stepCount, starsCount, undefined, undefined, message)
  }

  // !steps reset
  // Reset the challenge parameters
  if (
    commandName == "reset" &&
    message.author.id == CookieBunnyID
  ) {
    message.channel.send("are you sure? [y/n]");
    const collector = message.channel.createMessageCollector(message.channel, m => m.author.id === message.author.id, { time: 10000 });
    collector.on('collect', message => {
        if (message.content.toLowerCase() == "y") {
          stepCount = 0;
          starsCount = 0;
          message.channel.send("Challenge Reset!");
          collector.stop()
          return
        } else if (message.content.toLowerCase() == "n") {
          message.channel.send("ok! no reset made");
          collector.stop()
          return
        }
    })
  }


});

client.login(process.env.token);
