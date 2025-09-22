const ConfigManager = require("./../managers/ConfigManager");
const FileManager = require("./../managers/FileManager");
const { parse } = require("node-html-parser");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const OptifineUrl = "https://optifine.net/downloads";

let cache = undefined;

const cacheOptifine = async () => {
  cache = await axios.get(OptifineUrl);
};

const scrapSite = async () => {
  try {
    let res;
    if (cache) {
      res = cache;
      cacheOptifine();
    } else {
      res = await axios.get(OptifineUrl);
    }
    let versions = {};
    await parse(res.data)
      .querySelectorAll("td.colMirror > a")
      .forEach((elementHtml) => {
        try {
          const link = elementHtml.getAttribute("href");
          const regex = /OptiFine_([\d.]+)_HD_U_([\w]+)\.jar/g;
          const match = regex.exec(link);
          if (match !== null) {
            const mcVersion = match[1];
            const optifineVersion = match[2];
            if (!versions[mcVersion]) {
              versions[mcVersion] = [];
            }
            versions[mcVersion][optifineVersion] = {
              mc: mcVersion,
              optifine: optifineVersion,
              link,
            };
          }
        } catch (error) {
          throw new Error(`Error parsing optifine.\n${error}`);
        }
      });
    return versions;
  } catch (error) {
    throw new Error(`Error downloading optifine site.\n${error}`);
  }
};

const downloadInstaller = (optifineObject, callback) => {
  axios
    .get(optifineObject.link)
    .then(async (res) => {
      axios({
        method: "get",
        url:
          "https://optifine.net/" +
          (await parse(res.data))
            .querySelector("#Download > a")
            .getAttribute("href"),
        responseType: "stream",
      })
        .then(async (response) => {
          await FileManager.createIfNotExistDir(
            path.join(
              await ConfigManager.getVariable("rootPath"),
              "better",
              "optifine",
              optifineObject.mc.replaceAll(".", "_")
            )
          );
          const optifineJarPath = path.join(
            await ConfigManager.getVariable("rootPath"),
            "better",
            "optifine",
            optifineObject.mc.replaceAll(".", "_"),
            optifineObject.optifine + ".jar"
          );
          await FileManager.createIfNotExistFile(optifineJarPath);
          await fs.openSync(optifineJarPath, "w");

          const fileStream = fs.createWriteStream(optifineJarPath);
          const fileSize = parseInt(response.headers["content-length"], 10);
          let downloadedSize = 0;

          response.data.on("data", function (chunk) {
            downloadedSize += chunk.length;
            const downloadProgress = (downloadedSize / fileSize) * 100;
            callback({
              finished: false,
              progrss: downloadProgress.toFixed(2),
            });
          });

          response.data.pipe(fileStream);

          fileStream.on("finish", function () {
            callback({
              finished: true,
              optifineJarPath,
            });
          });

          return optifineJarPath;
        })
        .catch((err) => {
          throw new Error(`Error getting optifine jar.\n${err}`);
        });
    })
    .catch((err) => {
      throw new Error(`Error getting optifine page.\n${err}`);
    });
};

// ! tests
// (async () => {
//   const versions = await scrapSite();
//   console.log(versions["1.19.3"]["I3"]);
//   console.log(await downloadInstaller(versions["1.19.3"]["I3"]));
// })();

module.exports = { cacheOptifine, scrapSite, downloadInstaller };
