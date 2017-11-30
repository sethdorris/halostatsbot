var Discord = require('discord.js');
var apiKey = require('./keys').APIKey;
var clientId = require('./keys').ClientId;
//STEAM API KEY 61862B8B86AADC4D73B2A69E5CE28D3D
var csgoStats = require('csgostatsnode');
var stats = new csgoStats({ "apikey": apiKey });
var bot = new Discord.Client();
bot.login(clientId);

console.log(bot);

bot.on("ready", () => {
    console.log("bot is operational");
});

bot.on("guildMemberAdd", member => {
    
});

bot.on('message', message => {
    // If the message is "ping"
    if (message.content === 'ping') {
    // Send "pong" to the same channel
      message.channel.send('pong');
    }
    if (message.content.substring(0, 6) === "!stats") {
        console.log("Stats Firing");
        var sid = message.content.substring(7);
        console.log("SID : ", sid);
        try {
            stats.getStats(sid,
                data => {
                    var embed = buildEmbed(data, message.author);
                    var richEmbed = new Discord.RichEmbed(embed);
                    message.channel.send("here ya go", { embed: richEmbed });
                });
        } catch (e) {
            console.log(e)
        }
    }
});

function buildEmbed(data, author) {
    console.log("API Data", data);
    console.log("Player Stats", data.playerstats.stats);
    var kills = data.playerstats.stats[0].value;
    var deaths = data.playerstats.stats[1].value;
    var shots = data.playerstats.stats[42].value;
    var hits = data.playerstats.stats[41].value;
    var headshots = data.playerstats.stats[22].value;
    var kd = (kills / deaths).toFixed(2);
    var hours = data.playerstats.stats[2].value / 60 / 60;
    var accuracy = (hits / shots) * 100;
    var hper = (headshots / kills) * 100;
    console.log("shots", shots);
    console.log("hits", hits);
    console.log("headshots", headshots);
    console.log("accuracy ", Math.round(accuracy));
    console.log("headshot % ", Math.round(hper));
    return {
        title: "CS GO Stats",
        description: `Here is the stats ${author} requested for Steam ID: ${data.playerstats.steamID}`,
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
                name: "Hours Played",
                value: Math.round(hours).toString(),
                inline: true               
            },
            {
                name: "Accuracy",
                value: `${Math.round(accuracy).toString()} %`,
                inline: true

            },
            {
                name: "% Kills With Headshot",
                value: `${Math.round(hper)} %`,
                inline: true
            }
        ],
        footer: { text : "If you have ideas for additional stats let BruiseR- know!"}
    }
}
