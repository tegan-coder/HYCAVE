const VersionManager = require("./managers/VersionManager");
const JavaManager = require("./managers/JavaManager");
const installer = require("@xmcl/installer");
const xml2js = require("xml2js");
const core = require("@xmcl/core");
const user = require("@xmcl/user");
const logger = require("./../logger");
const { Auth } = require("msmc");

const authManager = new Auth("select_account");

const openLoginMS = () => {
  return authManager.launch("electron");
};

const launchClient = async (
  refreshToken,
  rootPath,
  versionName,
  memory,
  cb
) => {
  logger.info(refreshToken, rootPath, versionName, memory);
  const xboxManager = await authManager.refresh(refreshToken);
  const token = await xboxManager.getMinecraft();
  logger.info("Installing!");
  cb("install", "Installing!");
  const installAllTask = installer.installTask(
    await VersionManager.getVersionMeta(versionName),
    rootPath
  );
  await installAllTask.startAndWait({
    onUpdate(task) {
      cb(
        "install",
        `Action: ${task.name}`,
        installAllTask.progress,
        installAllTask.total,
        ((installAllTask.progress / installAllTask.total) * 100).toFixed(2)
      );
    },
    onFailed(task, error) {
      logger.info("onFailed", task.name, error);
    },
    onSuccessed(task, result) {
      logger.info("onSuccessed", task.name, result);
    },
    onCancelled(task) {
      logger.info("onCancelled", task.name);
    },
  });
  logger.info("Starting!");
  cb("install", "Starting!");
  const game = await core.launch({
    accessToken: token.mcToken,
    gameProfile: token.profile,
    gamePath: rootPath,
    version: versionName,
    maxMemory: memory,
    javaPath: await JavaManager.getJavaExecPath(),
    extraExecOption: { detached: true },
  });
  logger.info(`Minecraft PID: ${game.pid}`);
  cb("install", `Minecraft PID: ${game.pid}`);

  const parser = new xml2js.Parser();
  game.stdout.on("data", async (data) => {
    parser.parseString(data.toString(), function (err, result) {
      if (err) {
        cb("log", "err");
        return;
      }
      const timestamp = result["log4j:Event"]["$"]["timestamp"];
      const level = result["log4j:Event"]["$"]["level"];
      const thread = result["log4j:Event"]["$"]["thread"];
      const logMessage = result["log4j:Event"]["log4j:Message"][0];
      const date = new Date(parseInt(timestamp));
      const formattedTime = `${("0" + date.getHours()).slice(-2)}:${(
        "0" + date.getMinutes()
      ).slice(-2)}:${("0" + date.getSeconds()).slice(-2)}`;
      const formattedLog = `[${formattedTime}] [${thread}/${level}] ${logMessage}`;
      cb("log", formattedLog);
    });
  });

  game.on("error", (err) => {
    throw err;
  });
  return;
};

const launchClientAsCrack = async (
  nickname,
  uuid,
  rootPath,
  versionName,
  memory,
  cb
) => {
  logger.info(nickname, uuid, rootPath, versionName, memory);
  logger.info("Installing!");
  const installAllTask = installer.installTask(
    await VersionManager.getVersionMeta(versionName),
    rootPath
  );
  await installAllTask.startAndWait({
    onUpdate(task) {
      cb("install", task.name, installAllTask.progress, installAllTask.total);
    },
    onFailed(task, error) {
      logger.info("onFailed", task.name, error);
    },
    onSuccessed(task, result) {
      logger.info("onSuccessed", task.name, result);
    },
    onCancelled(task) {
      logger.info("onCancelled", task.name);
    },
  });
  logger.info("Starting!");
  const game = await core.launch({
    gameProfile: user.offline(nickname, uuid).selectedProfile,
    gamePath: rootPath,
    version: versionName,
    maxMemory: memory,
    javaPath: await JavaManager.getJavaExecPath(),
    extraExecOption: { detached: true },
  });
  logger.info(`Minecraft PID: ${game.pid}`);
  game.stdout.on("readable", cb);
  game.on("error", (err) => {
    throw err;
  });
  return;
};

const downloadOnly = async (rootPath, versionName, cb) => {
  logger.info(rootPath, versionName);

  logger.info("Installing!");
  const installAllTask = installer.installTask(
    await VersionManager.getVersionMeta(versionName),
    rootPath
  );
  await installAllTask.startAndWait({
    onUpdate(task) {
      cb("progress", {
        name: task.name,
        index: installAllTask.progress,
        total: installAllTask.total,
      });
    },
    onFailed(task, error) {
      cb("onFailed", task.name, error);
    },
  });

  cb = () => {};
  logger.info("InstallAllTask Done.");
  return;
};

module.exports = {
  openLoginMS,
  launchClient,
  launchClientAsCrack,
  downloadOnly,
};
