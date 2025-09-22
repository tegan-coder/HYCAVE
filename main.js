const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const FabricImplementation = require("./launcher/utils/FabricImplementation");
const AccountsManager = require("./launcher/managers/AccountManager");
const VersionManager = require("./launcher/managers/VersionManager");
const OptifineScraper = require("./launcher/utils/OptifineScraper");
const ConfigManager = require("./launcher/managers/ConfigManager");
const JavaManager = require("./launcher/managers/JavaManager");
const DiscordRPC = require("./launcher/utils/DiscordRPC");
const LauncherMain = require("./launcher/Launcher");
const isDev = require("electron-is-dev");
const logger = require("./logger");
const process = require("process");
const crypto = require("crypto");
const path = require("path");
const os = require("os");

app.disableHardwareAcceleration();

logger.info(`Logs in ${logger.logsFile} dir`);

let logListener;

const launchOptions = {
  accountObjSelected: "",
  versionNameSelected: "",
  memorySelected: 2,
};

if (isDev) {
  logger.info("Running in development");
  require("electron-reload")(__dirname, {
    electron: require(`${__dirname}/node_modules/electron`),
  });
} else {
  logger.info("Running in production");
}

require("ejs-electron");

var mainWindow = undefined,
  lastOFWindow = undefined;

const createWindow = () => {
  const { screen } = require("electron");
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    height: Math.round(height * 0.8),
    width: Math.round(width * 0.7),
    resizable: false,
    frame: false,
    webPreferences: {
      enableRemoteModule: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, "preloads", "main.js"),
    },
    darkTheme: true,
    title: "BetterLauncher",
  });
  mainWindow.loadFile(path.join(__dirname, "views", "main.ejs"));

  ConfigManager.loadConfig();
  AccountsManager.loadAccounts();
  FabricImplementation.cacheFabric();
  OptifineScraper.cacheOptifine();
  try {
    DiscordRPC.setupRPC((success, dcUser) => {
      mainWindow.webContents.on("did-finish-load", () => {
        if (success) {
          mainWindow.webContents.send(
            "statusDiscord",
            true,
            dcUser.username,
            `https://cdn.discordapp.com/avatars/${dcUser.id}/${dcUser.avatar}?size=24`
          );
        } else {
          mainWindow.webContents.send("statusDiscord", false);
        }
      });
    });
  } catch (error) {
    logger.info("Discord RPC failed");
  }
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  ConfigManager.saveConfig();
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("closeWindow", async () => {
  mainWindow.close();
});

ipcMain.on("minimalizeWindow", async () => {
  mainWindow.minimize();
});

ipcMain.on("openLoginMS", (event) => {
  LauncherMain.openLoginMS()
    .then(async (loginObj) => {
      const profile = await loginObj.getMinecraft();
      await AccountsManager.addAccount({
        premium: true,
        uuid: profile.profile.id,
        displayName: profile.profile.name,
        refreshToken: await loginObj.save(),
      });
      event.sender.send("statusLoginMS", "Success");
    })
    .catch((err) => {
      if (err === "error.gui.closed")
        return event.sender.send("statusLoginMS", `Przerwano logowanie`);
      event.sender.send("statusLoginMS", `Error ${JSON.stringify(err)}`);
    });
});

ipcMain.on("useCrack", async (event, name) => {
  await AccountsManager.addAccount({
    premium: false,
    uuid: crypto.randomUUID().replaceAll("-", ""),
    displayName: name,
  });
});

ipcMain.on("getAccounts", async (event) => {
  try {
    event.returnValue = await AccountsManager.getAccountsList();
  } catch (error) {
    event.returnValue = undefined;
    throw new Error(`Error getting information from main.\n${error}}`);
  }
});

ipcMain.on("selectedAccount", async (event, arg) => {
  launchOptions.accountObjSelected = await AccountsManager.getAccountByUUID(
    arg
  );
  logger.info(
    `zalogowano na konto ${launchOptions.accountObjSelected.displayName}`
  );
  await AccountsManager.setLastAccount(arg);
});

ipcMain.on("removeAccount", async (event, uuid) => {
  event.returnValue = await AccountsManager.removeAccountByUUID(uuid);
});

ipcMain.on("getLastVersions", async (event) => {
  try {
    event.returnValue = await VersionManager.getLastVersions();
  } catch (error) {
    event.returnValue = undefined;
    throw new Error(`Error getting information from main.\n${error}}`);
  }
});

ipcMain.on("selectedVersion", async (event, arg) => {
  await VersionManager.addLastVersion(arg);
  launchOptions.versionNameSelected = arg;
  logger.info(`wybrano wersje: ${launchOptions.versionNameSelected}`);
});

ipcMain.on("getInstalledVersions", async (event) => {
  try {
    event.returnValue = await VersionManager.getInstalledVersions();
  } catch (error) {
    event.returnValue = undefined;
    throw new Error(`Error getting information from main.\n${error}}`);
  }
});

ipcMain.on("disconnectRPC", async () => {
  DiscordRPC.disconnectRPC();
});

ipcMain.on("getVersionsByType", async (event, arg) => {
  try {
    let groupedVersions = [];
    if (arg == "alpha") {
      groupedVersions = Object.values(
        await VersionManager.getAvailableVersions("old_alpha")
      ).concat(
        Object.values(await VersionManager.getAvailableVersions("old_beta"))
      );
    } else if (arg == "optifine") {
      groupedVersions = Object.values(await OptifineScraper.scrapSite());
    } else if (arg == "fabric") {
      groupedVersions = [];
    } else {
      groupedVersions = Object.values(
        await VersionManager.getAvailableVersions(arg)
      );
    }
    let versionout = [];
    switch (arg) {
      case "release":
        groupedVersions.forEach((version) => {
          let mainversion =
            version.name.split(".")[0] + "." + version.name.split(".")[1];
          if (!versionout[mainversion]) {
            versionout[mainversion] = [];
          }
          versionout[mainversion].push(version.name);
        });
        break;
      case "snapshot":
        groupedVersions.forEach((version) => {
          if (version.name.includes("w")) {
            let mainversion = version.name.split("w")[0];
            if (!versionout[mainversion]) {
              versionout[mainversion] = [];
            }
            versionout[mainversion].push(version.name);
          } else if (version.name.includes("-")) {
            let mainversion = version.name.split("-")[0];
            if (!versionout[mainversion]) {
              versionout[mainversion] = [];
            }
            versionout[mainversion].push(version.name);
          } else {
            let mainversion = version.name;
            if (!versionout[mainversion]) {
              versionout[mainversion] = [];
            }
            versionout[mainversion].push(version.name);
          }
        });
        break;
      case "fabric":
        event.returnValue = [
          await FabricImplementation.getMcVersions(),
          await FabricImplementation.getLoaders(),
        ];
        break;
      case "optifine":
        groupedVersions.forEach((version) => {
          version = Object.values(version);
          if (!versionout[version[0].mc]) {
            versionout[version[0].mc] = [];
          }
          version.forEach((subVer) => {
            versionout[version[0].mc].push(`${subVer.mc}_${subVer.optifine}`);
          });
        });
        break;
      default:
        groupedVersions.forEach((version) => {
          if (!versionout[version.name]) {
            versionout[version.name] = [];
          }
          versionout[version.name].push(version.name);
        });
        break;
    }
    event.returnValue = Object.values(versionout);
  } catch (error) {
    event.returnValue = undefined;
    throw new Error(`Error getting information from main.\n${error}}`);
  }
});

ipcMain.on("getSummary", async (event) => {
  try {
    let safeOptions = JSON.stringify(launchOptions);
    safeOptions = JSON.parse(safeOptions);
    delete safeOptions.accountObjSelected.refreshToken;
    event.returnValue = safeOptions;
  } catch (error) {
    event.returnValue = undefined;
    throw new Error(`Error getting information from main.\n${error}}`);
  }
});

ipcMain.on("getOptionsInfo", async (event) => {
  try {
    event.returnValue = {
      memory: {
        selected: parseInt(launchOptions.memorySelected),
        max: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
      },
      java: { path: await JavaManager.getJavaExecPath() },
      game: { dir: await ConfigManager.getVariable("rootPath") },
      javaArgs: process.env._JAVA_OPTIONS ? undefined : "",
    };
  } catch (error) {
    event.returnValue = undefined;
    throw new Error(`Error getting information from main.\n${error}}`);
  }
});

ipcMain.on("downloadOptifine", async (event, mc, optifine) => {
  lastOFWindow = new BrowserWindow({
    height: 300,
    width: 600,
    resizable: false,
    webPreferences: {
      enableRemoteModule: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, "preloads", "optifine.js"),
    },
    darkTheme: true,
    title: `Optifine ${mc} ${optifine} Downloader`,
    parent: mainWindow,
    autoHideMenuBar: true,
    modal: true,
  });

  lastOFWindow.loadFile(path.join("views", "others", "optifine.ejs"));

  const onLog = (...logs) => {
    try {
      lastOFWindow.webContents.send("log", ...logs);
    } catch (error) {
      logListener = undefined;
    }
  };

  logListener = onLog;

  let mcNormalized = mc;
  if (mc.slice(mc.length - 2) == ".0") {
    mcNormalized = mc.slice(0, mc.length - 2);
  }

  lastOFWindow.webContents.send("updateDownloadMC", {
    version: { mc: mcNormalized, optifine },
    progrss: 0,
    doneCount: 0,
  });

  await LauncherMain.downloadOnly(
    ConfigManager.getVariable("rootPath"),
    mcNormalized,
    async (type, args) => {
      logListener(type, args);
      onLog(type, args);
      lastOFWindow.webContents.send("updateDownloadMC", {
        version: { mc: mcNormalized, optifine },
        progrss: (args.index / args.total) * 100,
      });
    }
  );
  logger.info(`Downloading Optifine ${mc} ${optifine}...`);
  onLog(`Downloading Optifine ${mc} ${optifine}...`);
  await OptifineScraper.downloadInstaller(
    (
      await OptifineScraper.scrapSite()
    )[mc][optifine],
    (data) => {
      lastOFWindow.webContents.send("updateDownloadOF", data);
    }
  );
});

ipcMain.on("saveOptions", (event, args) => {
  logger.info(args);
  launchOptions.memorySelected = args.ram;
  // TODO SEND JAVA PATH (args.java) TO JAVA MANAGER (replace the \n to "" on the end)
  if (ConfigManager.getVariable("rootPath") !== path.join(args.game)) {
    const oldPath = ConfigManager.getVariable("rootPath");
    ConfigManager.setVariable("rootPath", path.join(args.game));
    ConfigManager.saveConfig(oldPath);
    ConfigManager.saveConfig();
  }
  // TODO USE CUSTOM/GLOBAL JAVA ARGS
  process.env._JAVA_OPTIONS = args.args;
});

ipcMain.on("getDir", async (event, isJava, defaultLocation) => {
  try {
    const dir = await dialog.showOpenDialog({
      title: isJava
        ? "Select Java Executable (javaw.exe)"
        : "Select Minecraft RunDir (.minecraft)",
      defaultPath: defaultLocation,
      filters: [isJava ? { name: "Java Executable", extensions: ["exe"] } : {}],
      properties: [isJava ? "openFile" : "openDirectory"],
    });
    event.returnValue = dir;
  } catch (error) {
    event.returnValue = undefined;
    throw new Error(`Error getting information from main.\n${error}}`);
  }
});

ipcMain.on("runOptifineInstaller", async (event, path) => {
  try {
    JavaManager.executeJar(path, "", ({ exited }) => {
      if (exited) {
        if (lastOFWindow) lastOFWindow.close();
      }
    });
    event.returnValue = undefined;
  } catch (error) {
    event.returnValue = undefined;
    throw new Error(`Error getting information from main.\n${error}}`);
  }
});

ipcMain.on("runClient", async () => {
  const logsWindow = new BrowserWindow({
    height: 300,
    width: 600,
    resizable: false,
    webPreferences: {
      enableRemoteModule: false,
      contextIsolation: true,
      devTools: true,
      preload: path.join(__dirname, "preloads", "logs.js"),
    },
    darkTheme: true,
    title: `Running ${launchOptions.versionNameSelected} as ${launchOptions.accountObjSelected.displayName}`,
    parent: mainWindow,
    autoHideMenuBar: true,
    modal: false,
  });

  logsWindow.loadFile(path.join("views", "others", "logs.ejs"));

  const onLog = (...logs) => {
    try {
      if (logs[0] == "log")
        logsWindow.webContents.send("logMC", ...logs.slice(-1));
      if (logs[0] == "install") {
        logsWindow.webContents.send("log", logs[1]);
        logsWindow.webContents.send("updateDownloadMC", {
          progrss: logs[4],
        });
      }
    } catch (error) {
      logListener = undefined;
    }
  };

  logListener = onLog;

  if (launchOptions.accountObjSelected.premium) {
    await LauncherMain.launchClient(
      launchOptions.accountObjSelected.refreshToken,
      path.join(await ConfigManager.getVariable("rootPath")),
      launchOptions.versionNameSelected,
      launchOptions.memorySelected,
      (...logs) => {
        if (typeof logListener == "function") logListener(...logs);
      }
    ).catch(logger.error);
  } else {
    await LauncherMain.launchClientAsCrack(
      launchOptions.accountObjSelected.displayName,
      launchOptions.accountObjSelected.uuid,
      path.join(await ConfigManager.getVariable("rootPath")),
      launchOptions.versionNameSelected,
      launchOptions.memorySelected,
      (...logs) => {
        if (typeof logListener == "function") logListener(...logs);
      }
    ).catch(logger.error);
  }
});

process.on("unhandledRejection", (err, origin) => {
  logger.error(err, origin);
});

process.on("uncaughtException", (err, origin) => {
  logger.error(err, origin);
});
