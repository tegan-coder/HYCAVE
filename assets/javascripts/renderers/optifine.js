console.log("Loading renderer");

const progressBar = document.getElementById("progressBar");
const optifineHeader = document.getElementById("optifineHeader");
const log = document.getElementById("log");
const installButton = document.getElementById("install");
const finishModal = document.getElementById("finishModal");
const summary = document.getElementById("summary");

const statusMinecraft = document.getElementById("statusMinecraft"),
  statusOptifine = document.getElementById("statusOptifine"),
  statusInstaling = document.getElementById("statusInstalling");

let versionBackup = { mc: undefined, optifine: undefined };

const setScreensState = (screen) => {
  console.log();
  switch (screen) {
    case "mc":
      statusMinecraft.classList.add("text-[#FFA3FD]");
      statusMinecraft.classList.remove("text-gray-500");
      statusOptifine.classList.remove("text-[#FFA3FD]");
      statusOptifine.classList.add("text-gray-500");
      statusInstaling.classList.remove("text-[#FFA3FD]");
      statusInstaling.classList.add("text-gray-500");

      break;
    case "of":
      statusOptifine.classList.add("text-[#FFA3FD]");
      statusOptifine.classList.remove("text-gray-500");
      statusMinecraft.classList.remove("text-[#FFA3FD]");
      statusMinecraft.classList.add("text-gray-500");
      statusInstaling.classList.remove("text-[#FFA3FD]");
      statusInstaling.classList.add("text-gray-500");

      break;
    case "install":
      statusInstaling.classList.add("text-[#FFA3FD]");
      statusInstaling.classList.remove("text-gray-500");
      statusMinecraft.classList.remove("text-[#FFA3FD]");
      statusMinecraft.classList.add("text-gray-500");
      statusOptifine.classList.remove("text-[#FFA3FD]");
      statusOptifine.classList.add("text-gray-500");

      break;
  }
};

setScreensState("mc");

window.electron.updateDownloadMC((event, { version, progrss }) => {
  console.log("MC:", version, progrss);
  setScreensState("mc");
  if (version) {
    versionBackup = version;
    optifineHeader.innerText = `Minecraft ${version.mc}`;
  }
  if (progrss) {
    progressBar.innerText = Math.round(progrss) + "%";
    progressBar.style.width = progrss + "%";
  }
});

window.electron.updateDownloadOF(
  (event, { finished, progrss, optifineJarPath }) => {
    console.log("OF:", finished, progrss, optifineJarPath);
    if (!finished) {
      setScreensState("of");
      optifineHeader.innerText = `Optifine ${versionBackup.mc} ${versionBackup.optifine}`;
      summary.innerText = `Optifine ${versionBackup.mc} ${versionBackup.optifine}`;
      progressBar.innerText = Math.round(progrss) + "%";
      progressBar.style.width = progrss + "%";
    } else {
      setScreensState("install");
      finishModal.classList.remove("hidden");
      installButton.addEventListener("click", () => {
        window.electron.runInstaller(optifineJarPath);
      });
    }
  }
);

window.electron.log((event, ...logs) => {
  const text = [];
  logs.forEach((arg) => {
    if (typeof arg === "string") {
      text.push(arg);
    } else {
      text.push(JSON.stringify(arg));
    }
  });
  log.innerText = text.join(" ");
});
