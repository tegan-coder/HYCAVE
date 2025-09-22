const path = require("path");
const fs = require("fs");

const createIfNotExistDir = async (dir) => {
  if (await fs.existsSync(path.join(dir))) {
    return path.join(dir) + " exist";
  }
  try {
    const parentDir = path.dirname(path.join(dir));
    if (!(await fs.existsSync(parentDir))) {
      await createIfNotExistDir(parentDir);
    }
    await fs.mkdirSync(path.join(dir));
  } catch (error) {
    throw new Error(`Error checking ${dir}.`);
  }
  return path.join(dir) + " created";
};

const createIfNotExistFile = async (filepath) => {
  return await writeToFileOrCreate(filepath, "");
};

const writeToFileOrCreate = async (filepath, content) => {
  filepath = path.join(filepath);
  await createIfNotExistDir(path.dirname(filepath));
  if (await fs.existsSync(filepath)) {
    await fs.writeFile(filepath, content, (err) => {
      if (err) {
        throw new Error(`Error writing file ${filepath}.\n${err}`);
      }
      return filepath + " updated";
    });
  } else {
    try {
      await fs.writeFileSync(filepath, content, { flag: "wx" });
      return filepath + " created";
    } catch (error) {
      throw new Error(`Error writing file ${filepath}.\n${error}`);
    }
  }
};

// ! tests
// (async () => {
//   console.log(await createIfNotExistFile("D:/a/", "b.txt").catch(console.log));
// })();

module.exports = {
  createIfNotExistDir,
  createIfNotExistFile,
  writeToFileOrCreate,
};
