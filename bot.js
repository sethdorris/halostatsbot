var Discord = require('discord.js');
//STEAM API KEY 61862B8B86AADC4D73B2A69E5CE28D3D
var csgoStats = require('csgostatsnode');
var stats = new csgoStats({ "apikey": "61862B8B86AADC4D73B2A69E5CE28D3D" });
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
    channel.send(`Welcome to CSGO Team - Divine's Discord Channel ${member}. If you want to apply to join simply type !apply.`)
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
        var sid = message.content.substring(7);
        try {
            stats.getStats(sid,
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
      message.member.addRole(role).catch(err => console.log(err))
      //return message
      message.channel.send("Thanks for applying! Our recruiting director will be in touch to schedule a try out soon.")
    }
});

function buildEmbed(data, author) {
    console.log("data", data);
    try {
        var kills = data.playerstats.stats[0].value;
        var deaths = data.playerstats.stats[1].value;
        var shots = data.playerstats.stats[42].value;
        var hits = data.playerstats.stats[41].value;
        var headshots = data.playerstats.stats[22].value;
        var kd = (kills / deaths).toFixed(2);
        var hours = data.playerstats.stats[2].value / 60 / 60;
        var accuracy = (hits / shots) * 100;
        var hper = (headshots / kills) * 100;
    } catch (e) {
        return {
            title: "Whoops can't read that ID"
        }
    }
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
