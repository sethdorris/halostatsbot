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
    console.log(member);
});

bot.on('message', message => {
    // If the message is "ping"
    if (message.content === 'ping') {
    // Send "pong" to the same channel
      message.channel.send('pong');
    }
    if (message.content === "stats") {
        message.channel.send('What is your steam id? Remember to respond with the !sid prefix');
    }
    if (message.content.substring(0, 4) === "!sid") {
        console.log("Stats Firing");
        var sid = message.content.substring(5);
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
    var kd = (data.playerstats.stats.total_kills / data.playerstats.stats.total_deaths).toFixed(2);
    var hours = data.playerstats.stats.total_time_played / 60 / 60;
    return {
        title: "CS GO Stats",
        description: `Here is the stats for ${author}`,
        color: 0xf0df0f,
        fields: [
            {
                name: "Kills",
                value: data.playerstats.stats.total_kills.toString(),
                inline: true
            },
            {
                name: "Deaths",
                value: data.playerstats.stats.total_deaths.toString(),
                inline: true
            },
            {
                name: "K/D",
                value: kd,
                inline: true
            },
            {
                name: "Hours Played",
                value: hours                
            }
        ],
        footer: "If you have ideas for additional stats let BruiseR- know!"
    }
}
