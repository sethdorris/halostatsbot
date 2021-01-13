var Discord = require('discord.js');
const haloApiKey = process.env.HALO_KEY; ///<<< Get your own halo api key at https://developer.haloapi.com/
var fetch = require("node-fetch");
var bot = new Discord.Client();
var fs = require("fs");
var pg = require("pg");
var Timeout = require("await-timeout")
var stringify = require('csv-stringify');

const pool = new pg.Pool(process.env.CONNECTION_STRING);
bot.login(process.env.DISCORD_KEY); ///<<< Bot aka Application Token for Discord https://discordapp.com/developers/applications .. create a bot and then under
//your applications select the bot then click SETTINGS > BOT > and under the BOTs USERNAME click SHOW TOKEN .... that goes inside the quotes of bot.login("")

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
        if (user.rowCount > 1) {
            channel.send(`Welcome back to the Halo Draft League. We found your gamertag: ${user.rows[0].gamertag}`)
            var role = member.guild.roles.find("name", "Linked");
            member.addRole(role).catch(err => console.log(err));
        }
    } catch (e) {
        console.log("Member add error", e)
    }
});

bot.on("guildMemberRemove", member => {
    console.log("Someone left");
    var channel = member.guild.channels.find("name", "general");
    channel.send(`${member} has left the server.`);
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
            var userIdSql = `SELECT id FROM users WHERE discord_id = $1;`
            var sql = `DELETE FROM users WHERE discord_id = $1`;
            var sql1 = `DELETE FROM seasons_users WHERE user_id = $1;`
            var userId = await pool.query(userIdSql, [discordId]);
            var removedFromSeasons = await pool.query(sql1, [userId.rows[0].id])
            var removed = await pool.query(sql, [discordId]);
            var role = message.member.guild.roles.find("name", "Linked");
            message.member.removeRole(role).catch(err => console.log(err));
            message.channel.send("Thanks, your gamertag is no longer linked")
        } catch (e) {
            console.log("Error removing gamertag ", e);
            message.channel.send("Sorry, something went wrong unlinking your gamertag.");
        }
    }

    if (message.content.substring(0, 12) === "!servercount") {
        message.channel.send(`There are ${message.guild.members.filter(member => !member.user.bot).size} players in the server`);
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

    //if (message.content.substring(0, 9) === "!register") {
    //    var role = message.member.guild.roles.find(role => role.name == "Season 2 League Competitor");
    //    try {
    //        var user = message.member;
    //        var sql = `SELECT * FROM users WHERE discord_id = $1`;
    //        var result = await pool.query(sql, [user.id]);
    //        var registeredSql = `SELECT * FROM seasons_users WHERE user_id = $1 AND season_id = 2`;
    //        var alreadyRegistered = await pool.query(registeredSql, [result.rows[0].id]);
    //        if (alreadyRegistered.rowCount > 0) {
    //            throw new Error("You already registered dude.")
    //        }
    //        console.log(result);
    //        var sql2 = `INSERT INTO seasons_users (user_id, season_id) VALUES ($1, 2) RETURNING user_id;`
    //        var result2 = await pool.query(sql2, [result.rows[0].id]);
    //        console.log(result2);
    //        if (result.rowCount < 1) { throw new Error("You must link your gamertag first.") }
    //        if (result2.rowCount < 1) {
    //            throw new Error(`Server Error`);
    //        }
    //        message.member.addRole(role);
    //        message.channel.send("You are now a registered competitor for the Halo Draft League!")
    //    } catch (e) {
    //        console.log(e);
    //        message.channel.send(`Something went wrong, you were not successfully registered. ${e.message}`)
    //    }
    //}

    if (message.content.substring(0, 12) === "!leaguecount") {
        var sql = `SELECT COUNT(*) FROM seasons_users WHERE season_id = 2;`;
        try {
            var total = await pool.query(sql);
            console.log(total);
            message.channel.send(`There are ${total.rows[0].count} registered participants for the upcoming league!`)
        } catch (e) {
            message.channel.send("Whoops something went wrong. Someone slap BruiseR-!");
        }
    }

    if (message.content.substring(0, 11) === "!quitleague") {
        var user = message.member;
        try {
            var findPlayer = `SELECT * FROM users WHERE discord_id = $1;`;
            var player = await pool.query(findPlayer, [user.id]);
            var sql = `DELETE FROM seasons_users WHERE user_id = $1`;
            var removed = await pool.query(sql, [player.rows[0].id]);
            var role = message.member.guild.roles.find(role => role.name == "Season 2 League Competitor");
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

    if (message.content.substring(0, 15) === "!getregistered") {
        console.log("compiling ")
        try {
            var sql = "SELECT * FROM seasons_users JOIN users on seasons_users.user_id = users.id WHERE seasons_users.season_id = 2;";
            var users = await pool.query(sql);
            var csvData = [];
            users.rows.forEach(item => { 
                console.log(item)
                csvData.push({ "gamertag": item.gamertag })
            })
            console.log("data", csvData)
            stringify(csvData, (err, output) => { console.log("stringified data", output); console.log("error", err) })
        } catch (e) {
            console.log(e)
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
                fetchUsersStats(users.rows[i].gamertag)
                    .then(res =>
                        res.json()
                    )
                    .then(data => {
                        console.log("data", data)
                        var csr;
                        var highestCsr;
                        var avgDmgGm = (data.Results[0].Result.ArenaStats.TotalWeaponDamage + data.Results[0].Result.ArenaStats.TotalPowerWeaponDamage + data.Results[0].Result.ArenaStats.TotalGrenadeDamage) / data.Results[0].Result.ArenaStats.TotalGamesCompleted
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
                        var tier = csr == "Champion" || csr == "Onyx" ? data.Results[0].Result.ArenaStats.HighestCsrAttained.Csr : data.Results[0].Result.ArenaStats.HighestCsrAttained.Tier;
                        csvData.push({
                            gamertag: data.Results[0].Id,
                            kills: data.Results[0].Result.ArenaStats.TotalKills,
                            deaths: data.Results[0].Result.ArenaStats.TotalDeaths,
                            kd: (data.Results[0].Result.ArenaStats.TotalKills / data.Results[0].Result.ArenaStats.TotalDeaths).toFixed(2),
                            assists: data.Results[0].Result.ArenaStats.TotalAssists,
                            AvgDmgGm: avgDmgGm,
                            accuracy: Math.round((data.Results[0].Result.ArenaStats.TotalShotsLanded/data.Results[0].Result.ArenaStats.TotalShotsFired)*100),
                            group: `${csr}`,
                            tier: tier
                        })
                        var lastGt = users.rows[users.rows.length -1].gamertag;
                        var isLast = lastGt == data.Results[0].Id;
                        console.log("Last Gt", lastGt)
                        console.log("Is Last", isLast)
                        if (isLast) {
                            stringify(csvData, function(err, output) {
                                console.log(output)
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
        var avgDmgGm = (data.Results[0].Result.ArenaStats.TotalWeaponDamage + data.Results[0].Result.ArenaStats.TotalPowerWeaponDamage + data.Results[0].Result.ArenaStats.TotalGrenadeDamage) / data.Results[0].Result.ArenaStats.TotalGamesCompleted;
        var accuracy = Math.round((landed/shots)*100);
        var csr;
        var highestCsr;
        var totalTimePlayed = data.Results[0].Result.ArenaStats.TotalTimePlayed;
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
            highestCsr = csr == "Champion" || csr == "Onyx" ? `${csr} ${data.Results[0].Result.ArenaStats.HighestCsrAttained.Csr}` : `${csr} ${data.Results[0].Result.ArenaStats.HighestCsrAttained.Tier}`;  
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
            },
            {
                name: "Avg. Dmg Game",
                value: Math.round(avgDmgGm).toString(),
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
