var Discord = require('discord.js');
const haloApiKey = "0820ab16b84e419db0d34dcda8fc91c3";
var fetch = require("node-fetch");
var dbconfig = require("./dbconfig");
var bot = new Discord.Client();
var pg = require("pg");
const pool = new pg.Pool(dbconfig.development);
bot.login("Mzg1ODA0MTY0MTUzNzM3MjE4.DQG1yg.d_oEjcrI322_6R8KjO7guKJO4zg");

bot.on("ready", () => {
    console.log("bot is operational");
});

bot.on("guildMemberAdd", async member => {
    //look up to see if the user has a linked gamertag
    var channel = member.guild.channels.find('name', 'general');
    try {
        var sql = `SELECT * FROM users WHERE discord_id = $1`;
        var user = await pool.query(sql, [member.id]);
        var channel = member.guild.channels.find('name', 'general');
        if (user.rowCount < 1) {
            channel.send(`Welcome to the Halo Draft League's Discord Channel ${member}. Please link your XBL gamertag by typing !linkgt followed by your gamertag. \`!linkgt itsme\``)
        } else {
            channel.send(`Welcome back to the Halo Draft League. We found your gamertag: ${user.rows[0].gamertag}`)
            var role = member.guild.roles.find("name", "Linked");
            member.addRole(role).catch(err => console.log(err));
        }
    } catch (e) {
        console.log("Member add error", e);
        channel.send(`Welcome to the Halo Draft League's Discord Channel ${member}. Please link your XBL gamertag by typing !linkgt followed by your gamertag. \`!linkgt itsme\``)
    }
});

bot.on('message', async message => {
    var embed;
    var richEmbed;

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

    if (message.content.substring(0, 7) === "!linkgt") {
        var gamertag = message.content.substring(8);
        var discordId = message.author.id;
        try {
            var sql = `INSERT INTO users (discord_id, gamertag) VALUES ($1, $2)`;
            var createdUser = await pool.query(sql, [discordId, gamertag]);
            var role = message.member.guild.roles.find("name", "Linked");
            message.member.addRole(role).catch(err => console.log(err));
            message.channel.send("Thanks, your gamertag has now been linked to your discord.");
        } catch (e) {
            console.log("Error saving gamertag ", e);
            message.channel.send("Sorry, something went wrong linking that gamertag.");
        }
    }

    if (message.content.substring(0, 7) === "!showgt") {
        try {
            var user = message.mentions.members.first();
            var sql = `SELECT * FROM users WHERE discord_id = $1`;
            console.log("User Id", user.id)
            var result = await pool.query(sql, [user.id]);
            console.log(result)
            if (result.rowCount > 0) {
                message.channel.send(`${user.displayName}'s gamertag is: ${result.rows[0].gamertag}`)
            } else {
                message.channel.send(`${user.displayName}'s gamertag could not be found. Ensure you're requesting a gamertag for a linked account.`)
            }
        } catch (e) {
            console.log(e);
            message.channel.send("Whoops something went wrong.")
        }
    }

    if (message.content.substring(0, 9) === "!register") {
        var role = message.member.guild.roles.find(x => x.name === "League Competitor");
        try {
            message.member.addRole(role);
            message.channel.send("You are now a registered competitor for the Halo Draft League!")
        } catch (e) {
            message.channel.send("Something went wrong, you were not successfully registered.")
        }
    }
});

function buildEmbed(data, author) {
    console.log("data", data);
    try {
        var kills = data.Results[0].Result.ArenaStats.TotalKills;
        var deaths = data.Results[0].Result.ArenaStats.TotalDeaths;
        var csr;
        var highestCsr;
        var authorImage;
        if (data.Results[0].Result.ArenaStats.HighestCsrAttained != null) {
            switch (data.Results[0].Result.ArenaStats.HighestCsrAttained.DesignationId) {
                case 0:
                    csr = "Unranked";
                    authorImage = "https://content.halocdn.com/media/Default/games/halo-5-guardians/csr/unranked_00-61fca949c33f433ba7e7507d97ff130f.png";
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
                    authorImage = "https://content.halocdn.com/media/Default/games/halo-5-guardians/csr/csr_platinum_array01-c8df3dc366ea49209762f9b08189ffa6.png";
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
            highestCsr = `${csr} ${data.Results[0].Result.ArenaStats.HighestCsrAttained.Tier}`
        } else {
            highestCsr = "No CSR data available.";
            authorImage = "";
        }
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
        title: "Halo 5 Stats",
        description: `Here is the stats ${author} requested for XBL Gamertag: ${data.Results[0].Id}`,
        color: 0xf0df0f,
        author: {
            name: data.Results[0].Id,
            icon_url: authorImage
        },
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
