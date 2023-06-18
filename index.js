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

var stepGoal = 1000000;
var starGoal = 5000;
const PREFIX = "!steps";
const messageChannelID = process.env.ChannelID
const CookieBunnyID = process.env.CookieBunnyID


client.on("ready", () => {
  console.log("The bot is ready");
});

// the bot replys to !steps progress or a message reaction by calling this function to print the
// current progress bar for the challenge
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

  // checking if trigger was a reaction or a call to !steps progress
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

  // bot to only work in one channel at a time
  if (reaction.message.channel.id != messageChannelID) {
    return;
  }

  // This is true when the bot has reacted to the emoji that was added
  if (reaction.me) {
    return;
  }

  if (reaction.emoji.name != "👍") {
    return;
  }

  // only respond to messages that start with !steps
  if (!reaction.message.content.toLowerCase().startsWith(PREFIX)) {
    return;
  }

  // code to use roles instead of one user
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

  // remove any commas from a command ex. !steps 23,992
  const commandName = parts[1].replace(",", "");

  // if a number was provided
  if (!isNaN(commandName)){
    stepCount = stepCount + Math.round(Number(commandName));

    // add to star count if step count is above threshold
    if (Number(commandName) > starGoal) {
      starsCount++;
    }

    // write state data to the json file
    data["stepCount"] = stepCount
    data["starsCount"] = starsCount

    const JsonFileStream = fs.createWriteStream("./challenge-data.json")

    // JSON.striginfy makes the object into a string, `null, 6` makes it prettier
    JsonFileStream.write(JSON.stringify(data, null, 6), err => {
      if(err) console.error(err);
    })

    // bot reaction with thumbs up
    reaction.message.react("👍");

  // !steps remove 4334
  // reaction on remove command will remove steps from the total
  } else if (commandName == "remove") {
    // e.g. !steps remove 500
    if (!isNaN(parts[2])) {
      stepCount -= Math.round(Number(parts[2]));
    }
  }

  // reply with the progress bar
  printProgressBar(stepCount, starsCount, user, reaction, undefined);


});


client.on("messageCreate", (message) => {

  // !buh
  if (message.content == "buh") {
    let numberOfBuh = Math.floor(Math.random() * 10) + 1;
    // reply with a random number of buhs from 1 to 5
    message.channel.send("buh! ".repeat(numberOfBuh));
  }

  // only have bot reply to one channel ID
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
      "**Steps Challenge:** Reach 1,000,000 steps as a community!!" +
        "\nChallenge runs for one week from June 18th to 25th." +
        "\n" +
        "\nOnce a day, in the steps discord channel, submit steps by typing the command `!steps` followed by the number of steps you took!    e.g. `!steps 3400`" +
        "\nInclude a screenshot of an app that shows the number of steps you took so that it can be validated." +
        "\nA submission more than **5000 steps** receives a gold star! ⭐😮" +
        "\n" +
        "\nType `!steps progress` to see the current total steps progress bar." +
        "\nSubmit steps for either the previous day or current day." +
        "\nOnce it is validated it'll be added to the community total! 😊" +
        "\n" +
        "\nHave fun, Good luck! Share pics! Buh!"
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
