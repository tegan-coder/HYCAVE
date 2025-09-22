const DiscordRPC = require("discord-rpc");
const logger = require("./../../logger");
const clientId = "1106998157772075058";
var rpc;

const setupRPC = (cb) => {
  logger.info("Trying setup Discord RPC.");
  DiscordRPC.register(clientId);

  rpc = new DiscordRPC.Client({ transport: "ipc" });
  try {
    rpc.on("ready", async () => {
      logger.info(`Connected to Discord as ${rpc.user.username}`);
      cb(true, rpc.user);
      let emojis = ["😀", "🌳", "⛏️", "🗡️", "🛖", "🐉", "🔥", "💀", "🪁", "💎"],
        emojiIndex = 0,
        startTimestamp = Date.now();
      rpc
        .setActivity({
          state: "Launching Minecraft...",
          details: emojis[emojiIndex],
          startTimestamp,
          largeImageKey: "logo",
          smallImageKey: "mc-launcher",
          instance: true,
          buttons: [
            {
              label: "Join Discord!",
              url: "https://discord.com/invite/D4AytbE6GU",
            },
          ],
        })
        .catch((e) => {
          throw e;
        });

      setInterval(() => {
        emojiIndex++;
        if (emojiIndex > emojis.length - 1) emojiIndex = 0;
        rpc.setActivity({
          state: "Launching Minecraft...",
          details: emojis[emojiIndex],
          startTimestamp,
          largeImageKey: "logo",
          smallImageKey: "mc-launcher",
          instance: false,
          buttons: [
            {
              label: "Join Discord!",
              url: "https://discord.com/invite/D4AytbE6GU",
            },
          ],
        });
      }, 15 * 1000);
    });

    rpc.on("error", (err) => {
      throw new Error(`Error from Discord RPC: ${err}`);
    });

    rpc.login({ clientId }).catch((err) => {
      cb(false, undefined);
      throw new Error(`Error login rpc.\n${err}`);
    });
  } catch (error) {
    throw new Error(`Error setuping discord rpc.\n${error}`);
  }
};

const disconnectRPC = () => {
  try {
    rpc.destroy();
    return;
  } catch (e) {
    throw new Error(`Error disconnecting discord rpc.\n${e}`);
  }
};

module.exports = { setupRPC, disconnectRPC };
