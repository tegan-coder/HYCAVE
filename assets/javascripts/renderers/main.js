console.log("Loading renderer");

var _eventHandlers = {};

const addListener = (node, event, handler, capture = false) => {
  if (!(event in _eventHandlers)) {
    _eventHandlers[event] = [];
  }
  _eventHandlers[event].push({
    node: node,
    handler: handler,
    capture: capture,
  });
  node.addEventListener(event, handler, capture);
};

const removeAllListeners = (targetNode, event) => {
  _eventHandlers[event]
    .filter(({ node }) => node === targetNode)
    .forEach(({ node, handler, capture }) =>
      node.removeEventListener(event, handler, capture)
    );

  _eventHandlers[event] = _eventHandlers[event].filter(
    ({ node }) => node !== targetNode
  );
};

document.addEventListener("DOMContentLoaded", async () => {
  let safeState = 0;
  const statusLogin = document.getElementById("screenStatusLogin");
  const statusVersion = document.getElementById("screenStatusVersion");
  const statusRun = document.getElementById("screenStatusRun");

  statusLogin.addEventListener("click", () => {
    if (safeState > 1) {
      switchView(currentView, "#welcome");
      setScreensState("login");
      safeState = 1;
    }
  });
  statusVersion.addEventListener("click", () => {
    if (safeState > 2) {
      switchView(currentView, "#versions");
      setScreensState("version");
      safeState = 2;
    }
  });

  const setScreensState = (screen) => {
    setTimeout(() => {
      console.log();
      switch (screen) {
        case "login":
          statusLogin.classList.add("text-[#865DFF]");
          statusVersion.classList.remove("text-[#865DFF]");
          statusRun.classList.remove("text-[#865DFF]");
          statusLogin.childNodes[1].childNodes[1].classList.add("hidden");
          statusVersion.childNodes[1].childNodes[1].classList.add("hidden");
          statusLogin.classList.remove("cursor-pointer");
          statusVersion.classList.remove("cursor-pointer");
          statusRun.classList.remove("cursor-pointer");
          break;
        case "version":
          statusLogin.classList.remove("text-[#865DFF]");
          statusVersion.classList.add("text-[#865DFF]");
          statusRun.classList.remove("text-[#865DFF]");
          statusLogin.childNodes[1].childNodes[1].classList.remove("hidden");
          statusVersion.childNodes[1].childNodes[1].classList.add("hidden");
          statusLogin.classList.add("cursor-pointer");
          statusVersion.classList.remove("cursor-pointer");
          statusRun.classList.remove("cursor-pointer");
          break;
        case "run":
          statusLogin.classList.remove("text-[#865DFF]");
          statusVersion.classList.remove("text-[#865DFF]");
          statusRun.classList.add("text-[#865DFF]");
          statusLogin.childNodes[1].childNodes[1].classList.remove("hidden");
          statusVersion.childNodes[1].childNodes[1].classList.remove("hidden");
          statusLogin.classList.add("cursor-pointer");
          statusVersion.classList.add("cursor-pointer");
          statusRun.classList.remove("cursor-pointer");
          break;
      }
    }, 600);
  };

  switchView("#welcome", "#welcome");
  setScreensState("login");
  safeState = 1;

  const runClientButton = document.getElementById("runClient");
  const openLoginMS = document.getElementById("openLoginMS");
  const accountsList = document.getElementById("accountsList");
  const dropdownAccountButton = document.getElementById(
    "dropdownAccountButton"
  );
  const versionsList = document.getElementById("versionsList");
  const dropdownVersionButton = document.getElementById(
    "dropdownVersionButton"
  );

  dropdownAccountButton.addEventListener("click", async () => {
    accountsList.innerHTML = "";
    await window.electron.getAccounts().accounts.forEach((account) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.setAttribute("id", "selectAccountTrigger");
      a.setAttribute("data-mc-uuid", account.uuid);
      a.setAttribute(
        "class",
        "flex justify-center items-center cursor-pointer font-bold px-4 py-2 select-text hover:bg-[#865DFF] dark:hover:text-white hover:transition-all transition-all duration-300"
      );
      const div1 = document.createElement("div");
      const img = document.createElement("img");
      img.setAttribute(
        "src",
        `https://mc-heads.net/avatar/${account.displayName}`
      );
      img.setAttribute("width", "24");
      img.setAttribute("alt", "");
      img.setAttribute("class", "min-w-6");

      div1.appendChild(img);
      const p = document.createElement("p");
      p.setAttribute("class", "mx-1");
      p.textContent = account.displayName;
      const div2 = document.createElement("div");
      const i = document.createElement("i");
      i.setAttribute("class", "w-5 h-3 fa-sharp fa-solid fa-trash");
      div2.appendChild(i);
      div2.addEventListener("click", (event) => {
        event.stopPropagation();
        window.electron.removeAccount(account.uuid);
        dropdownAccountButton.click();
        setTimeout(() => {
          dropdownAccountButton.click();
        }, 150);
      });
      a.appendChild(div1);
      a.appendChild(p);
      a.appendChild(div2);
      li.appendChild(a);
      accountsList.appendChild(li);
    });

    const selectAccountTriggers = document.querySelectorAll(
      "#selectAccountTrigger"
    );

    selectAccountTriggers.forEach((selectAccountTrigger) => {
      selectAccountTrigger.addEventListener("click", () => {
        if (safeState < 2) {
          window.electron.selectAccount(selectAccountTrigger.dataset.mcUuid);
          switchView(currentView, "#versions");
          setScreensState("version");
          safeState = 2;
        }
      });
    });
  });

  dropdownVersionButton.addEventListener("click", async () => {
    versionsList.innerHTML = "";
    await window.electron.getLastVersions().forEach((version) => {
      const li = document.createElement("li");
      li.innerHTML = `<a id="selectVerionTrigger" data-mc-uuid="${version}" class="block cursor-pointer font-bold px-4 py-2 hover:bg-[#865DFF] dark:hover:text-white hover:transition-all transition-all duration-300"> ${version}</a>`;
      versionsList.appendChild(li);
    });

    const selectVersionTriggers = document.querySelectorAll(
      "#selectVerionTrigger"
    );
    selectVersionTriggers.forEach((selectVersionTrigger) => {
      selectVersionTrigger.addEventListener("click", () => {
        if (safeState < 3) {
          window.electron.selectVersion(selectVersionTrigger.dataset.mcUuid);
          switchView(currentView, "#run");
          setScreensState("run");
          safeState = 3;
          const summary = window.electron.getSummary();
          document.getElementById(
            "dynamicVersion"
          ).innerText = `Uruchom ${summary.versionNameSelected}`;
          document.getElementById(
            "dynamicPlayer"
          ).innerText = `Uruchamiasz grę jako ${summary.accountObjSelected.displayName}`;
        }
      });
    });
  });

  openLoginMS.addEventListener("click", () => {
    const loadingElement = document.getElementById("loading");
    const loadingTask = document.getElementById("currentTask");
    $(loadingElement).fadeIn(500);
    let loadingContainer = document.getElementById("loader");
    let loading = bodymovin.loadAnimation({
      wrapper: loadingContainer,
      animType: "svg",
      loop: false,

      path: "../assets/icons/Engines.json",
    });
    loading.addEventListener("complete", () => {
      loading.goToAndPlay(120, true);
    });
    loading.addEventListener("enterFrame", (e) => {
      if (e.currentTime >= 20) {
        loadingContainer.classList.remove("scale-[180]");
      }
    });
    window.electron.openLoginMS();
    window.electron.storeLoginStatus((event, data) => {
      loadingTask.innerText = data;
      setTimeout(() => {
        $(loadingElement).fadeOut(500, () => {
          loading.stop();
          loadingContainer.innerHTML = "";
          loadingContainer.classList.add("scale-[180]");
          loadingTask.innerText = "Logowanie...";
        });
        if (data == "Success")
          setTimeout(() => {
            dropdownAccountButton.click();
          }, 150);
      }, 1500);
    });
  });

  runClientButton.addEventListener("click", () => {
    window.electron.runClient();
  });

  const openVersionModalButton = document.getElementById(
    "openVersionModalButton"
  );
  const firstTable = document.getElementById("firstTable");
  const secondTable = document.getElementById("secondTable");
  const installedCategoryButton = document.getElementById("instCategoryButton"),
    releaseCategoryButton = document.getElementById("releaseCategoryButton"),
    snapshotCategoryButton = document.getElementById("snapshotCategoryButton"),
    alphaCategoryButton = document.getElementById("alphaCategoryButton"),
    fabricCategoryButton = document.getElementById("fabricCategoryButton"),
    forgeCategoryButton = document.getElementById("forgeCategoryButton"),
    optifineCategoryButton = document.getElementById("optifineCategoryButton");

  openVersionModalButton.addEventListener("click", () => {
    changeFirstTable("installed");
  });
  installedCategoryButton.addEventListener("click", () => {
    changeFirstTable("installed");
  });
  releaseCategoryButton.addEventListener("click", () => {
    changeFirstTable("release");
  });
  snapshotCategoryButton.addEventListener("click", () => {
    changeFirstTable("snapshot");
  });
  alphaCategoryButton.addEventListener("click", () => {
    changeFirstTable("alpha");
  });
  fabricCategoryButton.addEventListener("click", () => {
    changeFirstTable("fabric");
  });
  forgeCategoryButton.addEventListener("click", () => {
    changeFirstTable("forge");
  });
  optifineCategoryButton.addEventListener("click", () => {
    changeFirstTable("optifine");
  });

  const addFirstTableVersion = (version, final = false) => {
    const button = document.createElement("button");
    firstTable.style.display = "block";
    button.className =
      "break-words relative inline-flex items-center w-full px-4 py-2 text-sm first:rounded-t-lg last:rounded-b-lg font-medium border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-[#E384FF] dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white";
    button.innerText = `${version}`;
    if (final) {
      button.dataset.version = version;
      button.id = "finalVersionTrigger";
    } else {
      button.dataset.preVersion = version;
      button.id = "secondTableTrigger";
    }
    firstTable.appendChild(button);
  };

  const clearFirstTable = () => {
    firstTable.style.display = "none";
    firstTable.innerHTML = "";
  };

  const addSecondTableVersion = (version) => {
    const button = document.createElement("button");
    secondTable.style.display = "block";
    button.className =
      "break-words relative inline-flex items-center w-full px-4 py-2 text-sm font-medium first:rounded-t-lg last:rounded-b-lg border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-[#E384FF] dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white";
    button.innerText = `${version}`;
    button.dataset.version = version;
    button.id = "finalVersionTrigger";
    secondTable.appendChild(button);
  };

  const addSecondTableVersionOF = (version) => {
    const button = document.createElement("button");
    secondTable.style.display = "block";
    button.className =
      "relative inline-flex items-center w-full px-4 py-2 text-sm font-medium first:rounded-t-lg last:rounded-b-lg border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-[#E384FF] dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white";
    button.innerText = `${version}`;
    button.dataset.mc = version.split("_")[0];
    button.dataset.optifine = version.split("_")[1];
    button.id = "optifineDownloadTrigger";
    secondTable.appendChild(button);
  };

  const clearSecondTable = () => {
    secondTable.style.display = "none";
    secondTable.innerHTML = "";
  };

  const changeFirstTable = (category) => {
    switch (category) {
      case "installed":
        console.log("installed");
        clearFirstTable();
        clearSecondTable();
        window.electron.getInstalledVersions().forEach((version) => {
          addFirstTableVersion(version, true);
        });
        refreshSelectVersionTriggers();
        break;
      case "release":
        clearFirstTable();
        clearSecondTable();
        window.electron.getVersionsByType("release").forEach((version) => {
          addFirstTableVersion(version[version.length - 1]);
          document
            .querySelectorAll("#secondTableTrigger")
            .forEach((trigger) => {
              trigger.addEventListener("click", () => {
                (async () => {
                  clearSecondTable();
                  setTimeout(() => {
                    version.forEach((subVer) => {
                      if (
                        version[version.length - 1].includes(
                          trigger.dataset.preVersion
                        )
                      ) {
                        addSecondTableVersion(subVer);
                      }
                    });
                    refreshSelectVersionTriggers();
                  }, 100);
                })();
              });
            });
        });
        refreshSelectVersionTriggers();
        break;
      case "snapshot":
        console.log("snapshot");
        clearFirstTable();
        clearSecondTable();
        window.electron.getVersionsByType("snapshot").forEach((version) => {
          if (version[version.length - 1].includes("w")) {
            addFirstTableVersion(
              version[version.length - 1].split("w")[0] + "w"
            );
          } else {
            addFirstTableVersion(version[version.length - 1].split("-")[0]);
          }
          document
            .querySelectorAll("#secondTableTrigger")
            .forEach((trigger) => {
              trigger.addEventListener("click", () => {
                (async () => {
                  clearSecondTable();
                  setTimeout(() => {
                    version.forEach((subVer) => {
                      if (
                        version[version.length - 1].includes(
                          trigger.dataset.preVersion
                        )
                      ) {
                        addSecondTableVersion(subVer);
                      }
                    });
                    refreshSelectVersionTriggers();
                  }, 100);
                })();
              });
            });
        });
        refreshSelectVersionTriggers();
        break;
      case "alpha":
        console.log("alpha");
        clearFirstTable();
        clearSecondTable();
        window.electron.getVersionsByType("alpha").forEach((version) => {
          addFirstTableVersion(version[0], true);
        });
        refreshSelectVersionTriggers();
        break;
      case "fabric":
        console.log("fabric");
        clearFirstTable();
        clearSecondTable();
        window.electron.getVersionsByType("fabric")[0].forEach((versionMc) => {
          addFirstTableVersion(versionMc);
        });
        document.querySelectorAll("#secondTableTrigger").forEach((trigger) => {
          console.log(trigger);
          trigger.addEventListener("click", () => {
            (async () => {
              clearSecondTable();
              setTimeout(() => {
                window.electron
                  .getVersionsByType("fabric")[1]
                  .forEach((version) => {
                    console.log("chuj wie");
                    addSecondTableVersion(version);
                  });
                refreshSelectVersionTriggers();
              }, 100);
            })();
          });
        });
        refreshSelectVersionTriggers();
        break;
      case "forge":
        console.log("forge");
        clearFirstTable();
        clearSecondTable();
        refreshSelectVersionTriggers();
        break;
      case "optifine":
        console.log("optifine");
        clearFirstTable();
        clearSecondTable();
        window.electron.getVersionsByType("optifine").forEach((version) => {
          addFirstTableVersion(version[version.length - 1].split("_")[0]);
          document
            .querySelectorAll("#secondTableTrigger")
            .forEach((trigger) => {
              trigger.addEventListener("click", () => {
                (async () => {
                  clearSecondTable();
                  setTimeout(() => {
                    version.forEach((subVer) => {
                      if (
                        version[version.length - 1].includes(
                          trigger.dataset.preVersion
                        )
                      ) {
                        addSecondTableVersionOF(subVer);
                      }
                    });
                    refreshSelectVersionTriggers();
                  }, 100);
                })();
              });
            });
        });
        refreshSelectVersionTriggers();
        break;
    }
  };

  const refreshSelectVersionTriggers = () => {
    document
      .querySelectorAll("#finalVersionTrigger")
      .forEach((finalVersionTrigger) => {
        try {
          removeAllListeners(finalVersionTrigger, "click");
        } catch (error) {
          /*no listeners for this element, for now */
        }
        addListener(finalVersionTrigger, "click", () => {
          if (finalVersionTrigger.dataset.version) {
            window.electron.selectVersion(finalVersionTrigger.dataset.version);
            document
              .querySelectorAll(`[data-modal-hide="staticModal"]`)
              .forEach((closeBtn) => {
                setTimeout(() => {
                  dropdownVersionButton.click();
                }, 150);
                closeBtn.click();
              });
          }
        });
      });
    document
      .querySelectorAll("#optifineDownloadTrigger")
      .forEach((optifineDownloadTrigger) => {
        try {
          removeAllListeners(optifineDownloadTrigger, "click");
        } catch (error) {
          /*no listeners for this element, for now */
        }
        addListener(optifineDownloadTrigger, "click", () => {
          if (
            optifineDownloadTrigger.dataset.mc &&
            optifineDownloadTrigger.dataset.optifine
          ) {
            window.electron.downloadOptifine(
              optifineDownloadTrigger.dataset.mc,
              optifineDownloadTrigger.dataset.optifine
            );
            // document
            //   .querySelectorAll(`[data-modal-hide="staticModal"]`)
            //   .forEach((closeBtn) => {
            //     closeBtn.click();
            //   });
          }
        });
      });
  };
  const addCrackFinish = document.getElementById("addAccountOffline");
  const nickLengthText = document.getElementById("nickLengthText"),
    nickLengthAnim = document.getElementById("nickLengthAnim");
  const specialCharsText = document.getElementById("specialCharsText"),
    specialCharsAnim = document.getElementById("specialCharsAnim");
  const nicknameInput = document.getElementById("nicknameInput");
  const premiumNickText = document.getElementById("premiumNickText"),
    premiumNickAnim = document.getElementById("premiumNickAnim");
  let lengthPass = false,
    charsPass = false,
    premiumPass = false,
    fetchedName = "";

  nicknameInput.addEventListener("input", () => {
    if (nicknameInput.value.length > 3 && nicknameInput.value.length < 16) {
      nickLengthAnim.classList.remove("animate-pulse");
      nickLengthText.classList.remove("text-gray-400");
      nickLengthText.classList.add("text-[#E384FF]");
      lengthPass = true;
    } else {
      nickLengthAnim.classList.add("animate-pulse");
      nickLengthText.classList.add("text-gray-400");
      nickLengthText.classList.remove("text-[#E384FF]");
      lengthPass = false;
    }
    if (nicknameInput.value.match(/[^a-zA-Z0-9_]/)) {
      specialCharsAnim.classList.add("animate-pulse");
      specialCharsText.classList.add("text-gray-400");
      specialCharsText.classList.remove("text-[#E384FF]");
      charsPass = false;
    } else {
      specialCharsAnim.classList.remove("animate-pulse");
      specialCharsText.classList.remove("text-gray-400");
      specialCharsText.classList.add("text-[#E384FF]");
      charsPass = true;
    }
  });
  const checkPremium = () => {
    console.log(
      charsPass &&
        lengthPass +
          " : " +
          nicknameInput.value +
          " : " +
          fetchedName +
          " : " +
          (charsPass && lengthPass && fetchedName != nicknameInput.value)
    );
    if (
      charsPass &&
      lengthPass &&
      nicknameInput.value &&
      fetchedName != nicknameInput.value
    ) {
      fetch(
        `https://api.mojang.com/users/profiles/minecraft/${nicknameInput.value}`
      )
        .then((res) => {
          fetchedName = nicknameInput.value;
          res.json().then((data) => {
            console.log(data);
            if (Object.hasOwn(data, "id")) {
              premiumNickAnim.classList.add("animate-pulse");
              premiumNickText.classList.add("text-gray-400");
              premiumNickText.classList.remove("text-[#E384FF]");
              premiumPass = false;
            } else {
              premiumNickAnim.classList.remove("animate-pulse");
              premiumNickText.classList.remove("text-gray-400");
              premiumNickText.classList.add("text-[#E384FF]");
              premiumPass = true;
            }
          });
        })
        .catch(() => {
          premiumNickAnim.classList.remove("animate-pulse");
          premiumNickText.classList.add("text-gray-400");
          premiumNickText.classList.remove("text-[#E384FF]");
          premiumPass = true;
        });
    }
  };
  var premiumCheckInterval;
  document
    .querySelector(`[data-modal-target="offlineAccounts"]`)
    .addEventListener("click", () => {
      premiumCheckInterval = setInterval(checkPremium, 2500);
    });
  addCrackFinish.addEventListener("click", () => {
    checkPremium();
    if (lengthPass && charsPass && premiumPass) {
      window.electron.useCrack(nicknameInput.value);
      document
        .querySelectorAll(`[data-modal-hide="offlineAccounts"]`)
        .forEach((closeBtn) => {
          if (premiumCheckInterval) clearInterval(premiumCheckInterval);
          closeBtn.click();
          setTimeout(() => {
            dropdownAccountButton.click();
          }, 150);
        });
    }
  });
  const gamePath = document.getElementById("gamePath"),
    gamePathBtn = document.getElementById("gamePathBtn"),
    javaPath = document.getElementById("javaPath"),
    javaPathBtn = document.getElementById("javaPathBtn"),
    ramCount = document.getElementById("ramCount"),
    ramSlider = document.getElementById("ramSlider"),
    ramFree = document.getElementById("ramFree"),
    argsArea = document.getElementById("javaArgs");
  const info = window.electron.getOptionsInfo();

  gamePath.innerHTML = info.game.dir;
  javaPath.innerText = info.java.path;
  ramCount.innerText = info.memory.selected;
  argsArea.value = info.javaArgs;
  ramSlider.value = info.memory.selected;
  ramFree.innerText = `Zostało Ci ${
    info.memory.max - info.memory.selected
  }G do przeznaczenia`;
  ramSlider.setAttribute("max", info.memory.max);
  ramSlider.addEventListener("input", () => {
    ramCount.innerText = ramSlider.value;
    ramFree.innerText = `Zostało Ci ${(
      info.memory.max - ramSlider.value
    ).toFixed(1)}G do przeznaczenia`;
  });

  gamePathBtn.addEventListener("click", async () => {
    const userSelect = await window.electron.getDirByElectron(
      false,
      info.game.dir
    );
    if (userSelect.canceled) return;
    gamePath.innerText = userSelect.filePaths[0];
  });

  javaPathBtn.addEventListener("click", async () => {
    const userSelect = await window.electron.getDirByElectron(
      true,
      info.java.path
    );
    if (userSelect.canceled) return;
    javaPath.innerText = userSelect.filePaths[0];
  });

  document
    .querySelector(`[data-modal-hide="options"]`)
    .addEventListener("click", () => {
      window.electron.saveOptions({
        ram: ramSlider.value,
        java: javaPath.innerText,
        game: gamePath.innerText,
        args: argsArea.value,
      });
    });

  window.electron.storeDiscordInfo((event, success, username, link) => {
    if (!success) {
      document.getElementById("discord").innerHTML = "";
      return;
    }
    console.log(`DiscordRPC: ${username}`);
    document.getElementById("discordPic").classList.remove("hidden");
    document.getElementById("discordPic").src = link;
    document.getElementById("discordNick").innerText = username;
    document.getElementById("disconnectRPC").addEventListener("click", () => {
      window.electron.disconnectRPC();
      document.getElementById("discordPic").click();
      $("#discordPic").fadeOut(150, () => {
        document.getElementById("discord").innerHTML = "";
      });
    });
  });
});
