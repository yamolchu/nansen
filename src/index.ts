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

if (isMainThread) {
  for (let i = 0; i < emails.length; i++) {
    const worker = new Worker(__filename, {
      workerData: { email: emails[i], proxy: proxies[i] },
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
    });

    // Остановка создания потоков, когда достигнуто указанное количество
    if (i + 1 === config.numThreads) {
      break;
    }
  }
} else {
  const { email, proxy } = workerData;
  sendConfirmation(email, proxy);
}
