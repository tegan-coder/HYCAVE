console.log("Loading renderer");

const progressBar = document.getElementById("progressBar");
const log = document.getElementById("log");
const mcOutput = document.getElementById("mcOutput");

const statusMinecraft = document.getElementById("statusMinecraft"),
  statusRunning = document.getElementById("statusRunning");

let state = ";";

const setScreensState = (screen) => {
  state = screen;
  switch (screen) {
    case "mc":
      statusMinecraft.classList.add("text-[#FFA3FD]");
      statusMinecraft.classList.remove("text-gray-500");
      statusRunning.classList.remove("text-[#FFA3FD]");
      statusRunning.classList.add("text-gray-500");

      break;
    case "run":
      statusRunning.classList.add("text-[#FFA3FD]");
      statusRunning.classList.remove("text-gray-500");
      statusMinecraft.classList.remove("text-[#FFA3FD]");
      statusMinecraft.classList.add("text-gray-500");

      $(progressBar).fadeOut(150);
      $(log).fadeOut(150, () => {
        $(mcOutput).fadeIn(150);
      });

      break;
  }
};

setScreensState("mc");

window.electron.updateDownloadMC((event, { progrss }) => {
  setScreensState("mc");
  if (progrss) {
    progressBar.innerText = Math.round(progrss) + "%";
    progressBar.style.width = progrss + "%";
  }
});

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

window.electron.logMC((event, ...logs) => {
  if (state != "run") setScreensState("run");
  const text = [];
  logs.forEach((arg) => {
    if (typeof arg === "string") {
      text.push(arg);
    } else {
      text.push(JSON.stringify(arg));
    }
  });
  const log = document.createElement("p");
  log.innerText = text.join(" ");
  mcOutput.appendChild(log);
});
