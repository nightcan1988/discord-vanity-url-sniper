// bu benim yaptığım yaparken chatgpt den yardım aldığım güzel ve ideal hızda bir bottur.

"use strict";
const tls = require("tls");
const WebSocket = require("ws");
const extractJsonFromString = require("extract-json-from-string");

const guilds = {};
const sniperGuild = "1226619903860277318";
const sniperToken = "MTIxNTY2NTI4ODc5gKsGaE8QaYf5_QcUA";
const listenerToken = "MTIx";
const info = "12483788635";
let vanity;

const tlsOptions = {
    host: "canary.discord.com",
    port: 443,
    minVersion: "TLSv1.3",
    maxVersion: "TLSv1.3",
    handshakeTimeout: 3500,
    servername: "canary.discord.com",
};

let tlsSocket;
let websocket;

const socket = tls.connect(tlsOptions, () => {
    console.log("TLS connection established");

    tlsSocket = socket;

    websocket = new WebSocket('wss://gateway-us-east1-b.discord.gg');

    websocket.on('open', () => {
        console.log("WebSocket connection opened");
        websocket.send(JSON.stringify({
            op: 2,
            d: {
                token: listenerToken,
                intents: 1 << 0,
                properties: {
                    os: "linux",
                    browser: "firefox",
                    device: "desktop",
                },
            },
        }));
    });

    websocket.on('message', async (data) => {
        data = JSON.parse(data.toString());

        if (data.t === "GUILD_UPDATE") {
            const find = guilds[data.d.guild_id];
            if (find && find !== data.d.vanity_url_code) {
                const requestBody = JSON.stringify({ code: find });
                const requestHeader = [
                    `PATCH /api/v7/guilds/${sniperGuild}/vanity-url HTTP/1.1`,
                    `Host: canary.discord.com`,
                    `Authorization: ${sniperToken}`,
                    `Content-Type: application/json`,
                    `Content-Length: ${Buffer.byteLength(requestBody)}`,
                    "",
                    "",
                ].join("\r\n");
                const request = requestHeader + requestBody;
                tlsSocket.write(request);
                vanity = `${find} GUILD_UPDATE`;
            }
        } else if (data.t === "GUILD_DELETE") {
            const find = guilds[data.d.id];
            if (find) {
                const requestBody = JSON.stringify({ code: find });
                tlsSocket.write([
                    `PATCH /api/v7/guilds/${sniperGuild}/vanity-url HTTP/1.1`,
                    "Host: canary.discord.com",
                    `Authorization: ${sniperToken}`,
                    "Content-Type: application/json",
                    `Content-Length: ${requestBody.length}`,
                    "",
                    "",
                ].join("\r\n") + requestBody);
                vanity = `${find} guild delete`;
                console.log(`${find} GUILD_DELETE`);
            }
        } else if (data.t === "READY") {
            data.d.guilds.forEach((guild) => {
                if (guild.vanity_url_code) {
                    guilds[guild.id] = guild.vanity_url_code;
                }
            });
        }
    });

    websocket.on('close', (event) => {
        console.log(`WebSocket connection closed: ${event.reason} (${event.code})`);
        process.exit();
    });

    websocket.on('error', (error) => {
        console.error(`WebSocket error: ${error.message}`);
        process.exit(1);
    });

    setInterval(() => {
        tlsSocket.write(["GET / HTTP/1.1", "Host: discord.com", "", ""].join("\r\n"));
    }, 100);
});

socket.on("end", () => {
    console.log("TLS connection ended");
    process.exit();
});

socket.on("error", (error) => {
    console.error(`TLS error: ${error.message}`);
    process.exit(1);
});

socket.on("data", async (data) => {
    const ext = await extractJsonFromString(data.toString());
    const find = ext.find((e) => e.code || e.message);

    if (find) {
        const requestBody = JSON.stringify({
            content: `@everyone ${vanity} \n\`\`\`json\n${JSON.stringify(find)}\`\`\``,
        });

        const contentLength = Buffer.byteLength(requestBody);

        const requestHeader = [
            `POST /api/v7/channels/${info}/messages HTTP/1.1`,
            "Host: canary.discord.com",
            `Authorization: ${sniperToken}`,
            "Content-Type: application/json",
            `Content-Length: ${contentLength}`,
            "",
            "",
        ].join("\r\n");

        const request = requestHeader + requestBody;
        tlsSocket.write(request);
    }
});
