const {
  Worker,
  workerData,
  isMainThread,
  parentPort,
} = require("worker_threads");

const sendConfirmation = require("./sendConfirmation.ts");
const fs = require("fs");
const config = require("../inputs/config.ts");

function parseEmails(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const emails = [];

  lines.forEach((line) => {
    const [email, imapPass] = line.split(":");
    emails.push({ email: email.trim(), imapPass: imapPass.trim() });
  });

  return emails;
}
function parseProxies(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const proxies = [];

  lines.forEach((line) => {
    const proxy = line.trim();
    proxies.push(proxy);
  });

  return proxies;
}
const emails = parseEmails("./inputs/emails.txt");
const proxies = parseProxies("./inputs/proxies.txt");

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

function sendConfirmationRecursive(emails, proxies, index = 0, numThreads = 4) {
  if (index >= emails.length) {
    return;
  }

  const worker = new Worker(__filename, {
    workerData: { email: emails[index], proxy: proxies[index] },
  });
  worker.on("message", (message) => {
    console.log(message);
  });
  worker.on("error", (error) => {
    console.error(error);
  });
  worker.on("exit", (code) => {
    if (code !== 0) {
      console.error(`Thread Exit ${code}`);
    }
    sendConfirmationRecursive(emails, proxies, index + numThreads, numThreads);
  });
}
const main = async () => {
  if (isMainThread) {
    for (let i = 0; i < config.numThreads; i++) {
      await delay(config.customDelay);
      sendConfirmationRecursive(emails, proxies, i, config.numThreads);
    }
  } else {
    await delay(config.customDelay);
    const { email, proxy } = workerData;
    sendConfirmation(email, proxy);
  }
};
main();
