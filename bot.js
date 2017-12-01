var Discord = require('discord.js');
//STEAM API KEY 61862B8B86AADC4D73B2A69E5CE28D3D
var csgoStats = require('csgostatsnode');
var stats = new csgoStats({ "apikey": "61862B8B86AADC4D73B2A69E5CE28D3D" });
var bot = new Discord.Client();
bot.login("Mzg1ODA0MTY0MTUzNzM3MjE4.DQG1yg.d_oEjcrI322_6R8KjO7guKJO4zg");

console.log(bot);

var orgchart = {
    title: "Organization Chart",
    description: `Here is roster / org chart for Delta ESports`,
    color: 0xf0df0f,
    fields: [
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: "Founder",
            value: "BruiseR-",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: "Recruiting Director",
            value: "Kristopher London",
            inline: true
        },
        {
            name: "Alpha Team",
            value: "BruiseR-",
            inline: true

        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: "Kristopher London",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: "Fatlijah",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: "Zumbie",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: "Open",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: "Open",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: "Open",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: "Open",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: "Open",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: "Open",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: " ",
            value: "Open",
            inline: true
        },
        {
            name: " ",
            value: " ",
            inline: true
        },
        {
            name: "Selection Candidates",
            value: " ",
            inline: true
        }
    ]
}
var orgState = {
    orgChart: orgchart,
    rosterSlots: [7, 10, 13, 16, 19, 22, 25, 28, 31],
    addMember: function (displayName) {
        console.log(displayName);
        this.orgChart.fields.forEach((field, index) => {
            if (orgState.rosterSlots.indexOf(index) > -1) {
                if (field.value == "Open") {
                    field.value = displayName;
                }
            }
        });
        return this.orgChart;
    },
    removeMember: function(displayName) {
        this.orgChart.fields.forEach((field, index) => {
            if (rosterSlots.indexOf(index) > -1 && field.value == displayName) {
                field.value = "Open";
            }
        });
        return this.orgChat;
    }
}

bot.on("ready", () => {
    console.log("bot is operational");
});

bot.on("guildMemberAdd", member => {
    var role = member.guild.roles.find("name", "Visitor");
    member.addRole(role).catch(err => console.log(err));
});

bot.on('message', message => {
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
                    var embed = buildEmbed(data, message.author);
                    var richEmbed = new Discord.RichEmbed(embed);
                    message.channel.send("here ya go", { embed: richEmbed });
                });
        } catch (e) {
            console.log(e)
        }
    }

    if (message.content.substring(0, 9) === "!orgchart") {
        var splitMessage = message.content.substring(10).split(" ");
        var action = splitMessage[0];
        var embed;
        //put check for if this command is sent from me
        switch (action) {
            case "addmember":
                embed = orgState.addMember(message.mentions.members[0].displayName);
                break;
            case "removemember":
                embed = orgState.removeMember(message.mentions.members[0].displayName);
                break;
        }
        var richEmbed = new Discord.RichEmbed(embed);
        message.channel.send("Here ya go", { embed: richEmbed });
    }

    if (message.content.substring(0, 15) === "!showorg") {
        var embed = new Discord.RichEmbed(orgState.orgChart);
        message.channel.send("Here ya go", { embed: embed });
    }
});

function buildEmbed(data, author) {
    var kills = data.playerstats.stats[0].value;
    var deaths = data.playerstats.stats[1].value;
    var shots = data.playerstats.stats[42].value;
    var hits = data.playerstats.stats[41].value;
    var headshots = data.playerstats.stats[22].value;
    var kd = (kills / deaths).toFixed(2);
    var hours = data.playerstats.stats[2].value / 60 / 60;
    var accuracy = (hits / shots) * 100;
    var hper = (headshots / kills) * 100;
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
