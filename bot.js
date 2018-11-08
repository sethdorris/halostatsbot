var Discord = require('discord.js');
const haloApiKey = "0820ab16b84e419db0d34dcda8fc91c3";
var fetch = require("node-fetch");

var bot = new Discord.Client();
bot.login("Mzg1ODA0MTY0MTUzNzM3MjE4.DQG1yg.d_oEjcrI322_6R8KjO7guKJO4zg");

console.log(bot);
bot.on("ready", () => {
    console.log("bot is operational");
});

bot.on("guildMemberAdd", member => {
    var role = member.guild.roles.find("name", "Visitor");
    member.addRole(role).catch(err => console.log(err));
    var channel = member.guild.channels.find('name', 'general');
    channel.send(`Welcome to the Halo Draft League's Discord Channel ${member}. If you want to register as a Free Agent for the current season simply type \`!apply\`.`)
});

bot.on('message', message => {
    var embed;
    var richEmbed;
    // If the message is "ping"
    if (message.content === 'ping') {
    // Send "pong" to the same channel
      message.channel.send('pong');
    }
    if (message.content.substring(0, 6) === "!stats") {
        var gamertag = message.content.substring(7);
        var getString = `https://www.haloapi.com/stats/h5/servicerecords/arena?players=${gamertag}`;
        try {
            fetch(getString, { method: "GET", headers: { "Ocp-Apim-Subscription-Key": haloApiKey } })
                .then(res => res.json())
                .then(
                data => {
                    embed = buildEmbed(data, message.author);
                    richEmbed = new Discord.RichEmbed(embed);
                    message.channel.send("here ya go", { embed: richEmbed });
                });
        } catch (e) {
            console.log(e)
        }
    }

    if (message.content.substring(0, 6) === "!apply") {
      var role = message.member.guild.roles.find("name", "Candidate");
      console.log(role)
      message.member.addRole(role).catch(err => console.log(err));
      //return message
      message.channel.send(`Thanks for applying! A member of the staff will meet with you as soon as possible. You have ${message.member.haloStats.kills} kills in Halo!`);
    }
});

function buildEmbed(data, author) {
    console.log("data", data);
    try {
        var kills = data.Results[0].Result.ArenaStats.TotalKills;
        var deaths = data.Results[0].Result.ArenaStats.TotalDeaths;
        var csr;
        switch (data.Results[0].Result.ArenaStats.HighestCsrAttained.DesignationId) {
            case 0:
                csr = "Unranked";
                break;
            case 1:
                csr = "Bronze";
                break;
            case 2:
                csr = "Silver";
                break;
            case 3:
                csr = "Gold";
                break;
            case 4:
                csr = "Platinum";
                break;
            case 5:
                csr = "Diamond";
                break;
            case 6:
                csr = "Onyx";
                break;
            case 7:
                csr = "Champion"
                break;
        }
        var highestCsr = `${csr} ${data.Results[0].Result.ArenaStats.HighestCsrAttained.Tier}`
        //var shots = data.playerstats.stats[42].value;
        //var hits = data.playerstats.stats[41].value;
        //var headshots = data.playerstats.stats[22].value;
        var kd = (kills / deaths).toFixed(2);
        //var hours = data.playerstats.stats[2].value / 60 / 60;
        //var accuracy = (hits / shots) * 100;
        //var hper = (headshots / kills) * 100;
    } catch (e) {
        console.log("This is what sucked", e)
        return {
            title: "Whoops something went wrong!"
        }
    }
    return {
        title: "CS GO Stats",
        description: `Here is the stats ${author} requested for XBL Gamertag: ${data.Results[0].Id}`,
        color: 0xf0df0f,
        fields: [
            {
                name: "Kills",
                value: kills.toString(),
                inline: true
            },
            {
                name: "Deaths",
                value: deaths.toString(),
                inline: true
            },
            {
                name: "K/D",
                value: kd,
                inline: true
            },
            {
                name: "Highest CSR",
                value: highestCsr.toString(),
                inline: true
            }
        ],
        footer: { text : "If you have ideas for additional stats let BruiseR- know!"}
    }
}
