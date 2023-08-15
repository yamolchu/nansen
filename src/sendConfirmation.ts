const { random } = require("user-agents");
const axios = require("axios");
const { SocksProxyAgent } = require("socks-proxy-agent");
const config = require("../inputs/config.ts");
const { RecaptchaV2Task } = require("node-capmonster");
const verifyEmail = require("./verifyEmail.ts");
const cheerio = require("cheerio");

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
async function sendConfirmation(email, proxy) {
  const headers = {
    "user-agent": random().toString(),
    Origin: "https://www.nansen.ai",
    Referer: "https://www.nansen.ai/",
  };
  const agent = new SocksProxyAgent(`socks5://${proxy}`);
  const session = axios.create({
    headers: headers,
    httpsAgent: agent,
  });
  const getResponse = await session.get("https://www.nansen.ai/early-access");
  const $ = cheerio.load(getResponse.data);
  const captchaSettings = $('input[name="captcha_settings"]').val();
  const client = new RecaptchaV2Task(config.RecaptchaV2TaskKey);
  const task = client.task({
    websiteURL: "https://www.nansen.ai/early-access",
    websiteKey: "6LcnRGwnAAAAAH-fdJFy0hD3e4GeYxWkMcbkCwi2",
  });
  const taskId = await client.createWithTask(task);
  const result = await client.joinTaskResult(taskId);

  const data = {
    _gotcha: "",
    email: email.email,
    captcha_settings: captchaSettings,
    "g-recaptcha-response": await result.gRecaptchaResponse,
    submit: "Join Waitlist",
  };

  const response = await session.post(
    "https://getlaunchlist.com/s/yeywGr",
    data
  );

  console.log("confirmation has been sent");
  await delay(15000);

  verifyEmail(email, proxy);
}

module.exports = sendConfirmation;
