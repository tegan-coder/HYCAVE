const ConfigManager = require("./ConfigManager");
const installer = require("@xmcl/installer");
const path = require("path");
const fs = require("fs");

const getInstalledVersions = async () => {
  try {
    if (
      !(await fs.existsSync(
        path.join(await ConfigManager.getVariable("rootPath"), "versions")
      ))
    )
      return [];
    const versions = (
      await fs.readdirSync(
        path.join(await ConfigManager.getVariable("rootPath"), "versions"),
        { withFileTypes: true }
      )
    )
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
    return versions;
  } catch (error) {
    throw new Error(`Error getting installed versions.`);
  }
};

const getAvailableVersions = async (type) => {
  try {
    let versionList = [];
    (await installer.getVersionList()).versions.forEach((version) => {
      if (version.type != type) return;
      versionList[version.id] = { name: version.id, url: version.url };
    });
    return versionList;
  } catch (error) {
    throw new Error(`Error getting avalible ${type} versions.\n${error}`);
  }
};

const updateConfig = async (lastVersions) => {
  await ConfigManager.setVariable("lastVersions", lastVersions);
  return await ConfigManager.saveConfig();
};

const addLastVersion = async (version) => {
  const lastVersions = await getLastVersions();
  const index = lastVersions.indexOf(version);
  if (index !== -1) {
    lastVersions.splice(index, 1);
    lastVersions.unshift(version);
    await updateConfig(lastVersions);
  } else {
    if (lastVersions.length >= 3) {
      lastVersions.pop();
    }
    lastVersions.unshift(version);
    await updateConfig(lastVersions);
  }
  return lastVersions;
};

const getLastVersions = async () => {
  // TODO check if version exist
  try {
    const versionsList = await ConfigManager.getVariable("lastVersions");
    if (versionsList) {
      return versionsList;
    } else {
      return [];
    }
  } catch (error) {
    return [];
  }
};

const getVersionMeta = async (versionId) => {
  try {
    const version = (await installer.getVersionList()).versions.filter(
      (version) => version.id == versionId
    )[0];
    if (!version) throw new Error(`Error: No meta for ${versionId}.`);
    return version;
  } catch (error) {
    throw new Error(`Error: Get ${versionId} meta.\n${error}`);
  }
};

// ! tests
// (async () => {
//   logger.info(await getInstalledVersions());
//       logger.info(await getAvailableVersions("snapshot"));
//       logger.info(await getAvailableVersions("old_alpha"));
//   const versions = await getAvailableVersions("release");
//   logger.info(versions);
//   logger.info(versions["1.8.9"]);
//   logger.info(await downloadVersionJson(versions["1.8.9"]));
//   logger.info(await getVersionMeta("aaa"));
// })();

module.exports = {
  getInstalledVersions,
  getAvailableVersions,
  addLastVersion,
  getLastVersions,
  getVersionMeta,
};
