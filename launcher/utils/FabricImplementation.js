const axios = require("axios");

const FabricVersions = `https://meta.fabricmc.net/v2/versions/game`;
const FabricLoader = `https://meta.fabricmc.net/v2/versions/loader`;

let cache = [];
cache[0] = undefined;
cache[1] = undefined;

const cacheFabric = async () => {
  cache[0] = await axios.get(FabricVersions);
  cache[1] = await axios.get(FabricLoader);
};

const getMcVersions = async () => {
  let res;
  if (cache[0]) {
    res = cache[0];
    cacheFabric();
  } else {
    res = await axios.get(FabricVersions);
  }
  const versions = [];
  res.data.forEach((version) => {
    versions.push(version.version);
  });
  return versions;
};

const getLoaders = async () => {
  let res;
  if (cache[1]) {
    res = cache[1];
    cacheFabric();
  } else {
    res = await axios.get(FabricLoader);
  }
  const versions = [];
  res.data.forEach((loader) => {
    versions.push(loader.version);
  });
  return versions;
};

// const getLoaderByMc = async (mcVersion) => {
//   const res = await axios.get(`${FabricLoader}/${mcVersion}`);
//   const versions = [];
//   res.data.forEach((loader) => {
//     versions.push(loader.loader.version);
//   });
//   return versions;
// };

// ! tests
// (async () => {
//   console.log(await getMcVersions());
//   console.log(await getLoaderByMc("1.19"));
// })();

module.exports = {
  cacheFabric,
  getMcVersions,
  getLoaders,
};
