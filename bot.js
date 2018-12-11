var Discord = require('discord.js');
const haloApiKey = "0820ab16b84e419db0d34dcda8fc91c3";
var fetch = require("node-fetch");
var dbconfig = require("./dbconfig");
var bot = new Discord.Client();
var fs = require("fs");
var pg = require("pg");
var Timeout = require("await-timeout")
var stringify = require('csv-stringify');
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
            channel.send(`Welcome to the Halo Draft League's Discord Channel ${member}. Please link your XBL gamertag by typing !linkgt followed by your gamertag. \`!linkgt itsme\`. If you want to register for the league first link your gamertag and then in a message by itself type \`!register\`.`)
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

    if (message.content.substring(0, 9) === "!removegt") {
        try {
            var discordId = message.author.id;
            var sql = `DELETE FROM users WHERE discord_id = $1`;
            var removed = await pool.query(sql, [discordId]);
            var role = message.member.guild.roles.find("name", "Linked");
            message.member.removeRole(role).catch(err => console.log(err));
            message.channel.send("Thanks, your gamertag is no longer linked")
        } catch (e) {
            console.log("Error removing gamertag ", e);
            message.channel.send("Sorry, something went wrong unlinking your gamertag.");
        }
    }

    if (message.content.substring(0, 7) === "!showgt") {
        try {
            var user = message.mentions.members.first();
            var sql = `SELECT * FROM users WHERE discord_id = $1`;
            console.log("User Id", user.id)
            var result = await pool.query(sql, [user.id]);
            console.log(result)
            if (result.rowCount > 0 && result.rows[0].gamertag !== null) {
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
        var role = message.member.guild.roles.find("name", "League Competitor");
        try {
            var user = message.member;
            var sql = `SELECT * FROM users WHERE discord_id = $1`;
            var result = await pool.query(sql, [user.id]);
            if (result.rowCount < 1) { throw new Error("You must link your gamertag first.")}
            var sql2 = `UPDATE users SET registered = true WHERE discord_id = $1`;
            var result2 = await pool.query(sql2, [user.id]);
            if (result2.rowCount < 1) { throw new Error("Kick BruiseR!")}
            message.member.addRole(role);
            message.channel.send("You are now a registered competitor for the Halo Draft League!")
        } catch (e) {
            message.channel.send(`Something went wrong, you were not successfully registered. ${e.message}`)
        }
    }
    
    if (message.content.substring(0, 12) === "!leaguecount") {
        var sql = `SELECT * FROM users WHERE registered = true`;
        try {
            var total = await pool.query(sql);
            message.channel.send(`There are ${total.rowCount} registered participants for the upcoming league!`)
        } catch (e) {
            message.channel.send("Whoops something went wrong. Someone slap BruiseR-!");
        }
    }

    if (message.content.substring(0, 11) === "!quitleague") {
        var user = message.member;
        try {
            var sql = `UPDATE users SET registered = false WHERE discord_id = $1`;
            var removed = await pool.query(sql, [user.id]);
            var role = message.member.guild.roles.find("name", "League Competitor");
            message.member.removeRole(role);
            message.channel.send("Aww. Sorry to see you go! I removed you from the league.")
        } catch (e) {
            message.channel.send("Someone kick BruiseR-. He messed up the bot again.")
        }
    }

    if (message.content.substring(0, 5) === "!help") {
        var embedObj = buildHelpEmbed();
        message.channel.send("Bot Help", { embed: embedObj })
    }

    if (message.content.substring(0, 6) === "!whois") {
        var gamertag = message.content.substring(7);
        try {
            var sql = `SELECT discord_id FROM users WHERE LOWER(gamertag) = LOWER($1)`;
            var user = await pool.query(sql, [gamertag]);
            console.log("UserRows", user.rows[0])
            var displayName = message.guild.members.get(`${user.rows[0].discord_id}`)
            console.log("Result", displayName)
            if (displayName !== null) {
                message.channel.send(`You're looking at ${displayName.displayName}'s gamertag.`)
            } else {
                message.channel.send(`I do not know who that is!`);
            }
        } catch (e) {
            console.log(e)
            message.channel.send("I do not know who that is.")
        }
    }

    if (message.content.substring(0, 13) === "!compilestats" && message.author.username === "BruiseR-") {
        console.log("Compiling stats...")
        console.log("Author", message.author)
        try {
            var sql = `SELECT gamertag FROM users WHERE registered = true`;
            var users = await pool.query(sql);
            console.log("users", users.rows);
            var csvData = [];
            for (var i = 0; i < users.rows.length; i++) {
                if (i === 9 || i === 19 || i === 29 || i === 39 || i === 49 || i === 59 || i === 69) {
                    await Timeout.set(11000);
                }
                var lastGt = users.rows[users.rows.length -1].gamertag;
                var isLast = lastGt == users.rows[i];
                fetchUsersStats(users.rows[i].gamertag)
                    .then(res =>
                        res.json()
                    )
                    .then(data => {
                        console.log("data", data)
                        var csr;
                        var highestCsr;
                        if (data.Results[0].Result.ArenaStats.HighestCsrAttained != null) {
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
                            highestCsr = `${csr} ${data.Results[0].Result.ArenaStats.HighestCsrAttained.Tier}`
                        } else {
                            highestCsr = "No CSR data available.";
                        }
                        csvData.push({
                            gamertag: data.Results[0].Id,
                            kills: data.Results[0].Result.ArenaStats.TotalKills,
                            deaths: data.Results[0].Result.ArenaStats.TotalDeaths,
                            kd: (data.Results[0].Result.ArenaStats.TotalKills / data.Results[0].Result.ArenaStats.TotalDeaths).toFixed(2),
                            assists: data.Results[0].Result.ArenaStats.TotalAssists,
                            shots: data.Results[0].Result.ArenaStats.TotalShotsFired,
                            landed: data.Results[0].Result.ArenaStats.TotalShotsLanded,
                            accuracy: Math.round((data.Results[0].Result.ArenaStats.TotalShotsLanded/data.Results[0].Result.ArenaStats.TotalShotsFired)*100),
                            csr: `${csr} ${highestCsr}`
                        })
                        if (isLast) {
                            stringify(csvData, function(err, output) {
                                fs.writeFile('leaguedata.csv', output, 'utf8', function(err) {
                                    if (err) {
                                        console.log('Some error occured - file either not saved or corrupted file saved.');
                                    } else {
                                        console.log('It\'s saved!');
                                    }
                                });
                            });
                        }
                    })
            }
        } catch (e) {
            console.log("Error before fetch", e)
            message.channel.send("Something went wrong before I could fetch data");
        }
    }
});

    function buildHelpEmbed() {
        return {
            "title": "Help Commands",
            "description": "A list of helpful commands from the HDL Bot.",
            "color": 54271,
            "author": {
                "name": "Halo Draft Bot",
                "url": "https://discordapp.com",
                "icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
            },
            "fields": [
              {
                  "name": "`!linkgt yourtaghere`",
                  "value": "Links your gamertag to your discord account."
              },
              {
                  "name": "`!stats gamertaghere`",
                  "value": "Retrieves a users halo 5 stats."
              },
              {
                  "name": "`!showgt @user`",
                  "value": "Retrieves a users gamertag if it is linked to their discord."
              },
              {
                  "name": "`!register`",
                  "value": "Registers you as a participant in the halo draft league!"
              },
              {
                  "name": "`!leaguecount`",
                  "value": "Shows total number of registered league participants"
              },
              {
                  "name": "`!quitleague`",
                  "value": "Remove yourself as a participant from the league."
              },
              {
                  "name": "`!removegt`",
                  "value": "Removes the linked gamertag to your discord account."
              },
              {
                  "name": "`!whois gamertaghere`",
                  "value": "Finds the discord display name given a user's gamertag. Only works if the discord account has linked a gamertag in this server."
              }
            ]
        };
    }

function buildEmbed(data, author) {
    console.log("data", data);
    try {
        var kills = data.Results[0].Result.ArenaStats.TotalKills;
        var deaths = data.Results[0].Result.ArenaStats.TotalDeaths;
        var assists = data.Results[0].Result.ArenaStats.TotalAssists;
        var shots = data.Results[0].Result.ArenaStats.TotalShotsFired;
        var landed = data.Results[0].Result.ArenaStats.TotalShotsLanded;
        var accuracy = Math.round((landed/shots)*100);
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
            },
            {
                name: "Assists",
                value: assists,
                inline: true
            },
            {
                name: "Accuracy",
                value: accuracy + "%",
                inline: true
            }
        ],
        footer: { text : "If you have ideas for additional stats let BruiseR- know!"}
    }
}

var fetchUsersStats = function(gamertag) {
    console.log("Gamertag", gamertag)
    var getString = `https://www.haloapi.com/stats/h5/servicerecords/arena?players=${gamertag}`;
    return fetch(getString, { method: "GET", headers: { "Ocp-Apim-Subscription-Key": haloApiKey } })
}
