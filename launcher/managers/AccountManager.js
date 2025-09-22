const ConfigManager = require("./ConfigManager");
const FileManager = require("./FileManager");
const logger = require("./../../logger");
const path = require("path");
const fs = require("fs");

const accountsFilePath = async () => {
  const rootPath = await ConfigManager.getVariable("rootPath");
  return path.join(rootPath, "better", "accounts.json");
};

const accounts = { accounts: [], lastAccount: "" };

const saveAccounts = async () => {
  try {
    const accountsJSON = JSON.stringify(accounts, null, 2);
    await FileManager.writeToFileOrCreate(
      await accountsFilePath(),
      accountsJSON
    );
    logger.info(`Accounts saved successfully to ${await accountsFilePath()}`);
    return accounts;
  } catch (error) {
    throw new Error(`Error saving accounts.\n${error}`);
  }
};

const loadAccounts = async () => {
  if (!(await isAccountsExist())) {
    logger.info("Accounts doesn't exist");
    return await saveAccounts();
  }
  try {
    const accountsData = await fs.promises.readFile(await accountsFilePath());
    Object.assign(accounts, JSON.parse(accountsData));
    logger.info(
      `Accounts loaded successfully from ${await accountsFilePath()}`
    );
    return accounts;
  } catch (error) {
    throw new Error("Error loading accounts.");
  }
};

const isAccountsExist = async () => {
  try {
    return fs.existsSync(await accountsFilePath());
  } catch (error) {
    throw new Error("Error checking if accounts.json file exists.");
  }
};

const isNewAccount = async (accountObj) => {
  return await isNewAccountByUUID(accountObj.uuid);
};

const isNewAccountByUUID = async (uuid) => {
  const accountsList = await getAccountsList();
  return !accountsList.accounts.some((account) => account.uuid === uuid);
};

const addAccount = async (accountObj) => {
  try {
    if (await isNewAccount(accountObj)) {
      accounts.accounts.push(accountObj);
      await saveAccounts();
    } else {
      logger.info(`${accountObj.displayName} already exists`);
    }
  } catch (error) {
    throw new Error("Error adding account to accounts.json file.");
  }
};

const removeAccountByUUID = async (uuid) => {
  try {
    if (!(await isNewAccountByUUID(uuid))) {
      accounts.accounts.splice(
        await accounts.accounts.findIndex((account) => account.uuid === uuid),
        1
      );
      await saveAccounts();
    } else {
      logger.info(`${uuid} no exists`);
    }
  } catch (error) {
    throw new Error("Error removing account from accounts.json file.");
  }
};

const getAccountsList = async () => {
  try {
    if (await isAccountsExist()) {
      const accountsData = await fs.promises.readFile(await accountsFilePath());
      return JSON.parse(accountsData);
    } else {
      return accounts;
    }
  } catch (error) {
    throw new Error("Error getting accounts list from accounts.json file.");
  }
};

const getAccountByUUID = async (uuid) => {
  try {
    const accountsList = await getAccountsList();
    const account = accountsList.accounts.find(
      (account) => account.uuid === uuid
    );
    if (account) {
      return account;
    } else {
      throw new Error(`Account ${uuid} doesn't exist.`);
    }
  } catch (error) {
    throw new Error(
      `Error getting account by UUID(${uuid}) from accounts.json file.`
    );
  }
};

const setLastAccount = async (uuid) => {
  try {
    accounts.lastAccount = uuid;
    await saveAccounts();
  } catch (error) {
    throw new Error(
      `Error setting last account in accounts.json file.\n${error}`
    );
  }
};

module.exports = {
  loadAccounts,
  saveAccounts,
  removeAccountByUUID,
  addAccount,
  getAccountsList,
  getAccountByUUID,
  setLastAccount,
};
