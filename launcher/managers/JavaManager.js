// TODO IT WILL DOWNLAD JAVA, CHECK LOCATION AND RUN JAR
const process = require("child_process");
const logger = require("./../../logger");
const path = require("path");
const installer = require("@xmcl/installer");

const getJavaExecPath = async () => {
  const paths = await installer.getPotentialJavaLocations();
  for (const javaPath of paths) {
    if (
      path.extname(javaPath) === ".exe" &&
      path.basename(javaPath, ".exe") === "java"
    ) {
      return javaPath;
    }
  }
  throw new Error("No Java executable found");
};

const executeJar = async (jarPath, javaArgs = "", cb = () => {}) => {
  logger.info(
    "Running",
    jarPath,
    " with java ",
    await getJavaExecPath(),
    " with arguments {",
    javaArgs,
    "}"
  );
  const java = process.exec(
    `"${path.join(await getJavaExecPath())}" -jar ${path.join(
      jarPath
    )} ${javaArgs}`,
    { detached: true }
  );
  java.unref();
  java.on("exit", () => {
    cb({ exited: true });
  });
};

// ! test
// (async () => {
//   console.log(await getJavaExecPath());
// })();

module.exports = { getJavaExecPath, executeJar };
