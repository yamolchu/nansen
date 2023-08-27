const Imap = require("imap");
const MailParser = require("mailparser").MailParser;
const simpleParser = require("mailparser").simpleParser;
const cheerio = require("cheerio");
const { random } = require("user-agents");
const axios = require("axios");
const { SocksProxyAgent } = require("socks-proxy-agent");
const { HttpsProxyAgent } = require("https-proxy-agent");
const config = require("../inputs/config.ts");

const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const csvWriter = createCsvWriter({
  path: "./result.csv",
  header: [
    { id: "email", title: "Email" },
    { id: "proxy", title: "Proxy" },
  ],
  append: true,
});
function verifyEmail(email, proxy) {
  const headers = {
    "user-agent": random().toString(),
    Origin: "https://www.nansen.ai",
    Referer: "https://www.nansen.ai/",
  };
  const agent = new SocksProxyAgent(`socks5://${proxy}`);
  const session = axios.create({
    headers: headers,
    httpsAgent:
      config.proxyType === "http"
        ? new HttpsProxyAgent(`http://${proxy}`)
        : new SocksProxyAgent(`socks5://${proxy}`),
  });
  const imapConfig = {
    user: email.email,
    password: email.imapPass,
    host: "outlook.office365.com",
    port: 993,
    tls: true,
  };
  const searchCriteria = [
    [
      "SUBJECT",
      "Verify Email Address - Nansen 2 Early Access Waitlist Program",
    ],
  ];

  const imap = new Imap(imapConfig);

  function openInbox(cb) {
    imap.openBox("INBOX", true, cb);
  }

  imap.once("ready", function () {
    openInbox(function (err, box) {
      if (err) throw err;
      imap.search(searchCriteria, function (err, results) {
        if (err) throw err;

        const fetch = imap.fetch(results, { bodies: "" });

        fetch.on("message", function (msg, seqno) {
          const mailparser = new MailParser();

          msg.on("body", (stream, info) => {
            simpleParser(stream, (err, parsed) => {
              if (err) throw err;

              const htmlContent = parsed.html;
              function parseVerificationLink(html) {
                const $ = cheerio.load(html);
                const element = $('a[rel="noopener noreferrer"]');
                const verificationLink = $(element).attr("href");
                return verificationLink;
              }
              const verificationLink = parseVerificationLink(htmlContent);
              const verify = async () => {
                const response = await session.get(verificationLink);
                if (response.status === 200) {
                  console.log(`Verification ${email.email} was successful`);
                  const resultData = [
                    {
                      email: email.email,
                      proxy: proxy,
                    },
                  ];
                  await csvWriter
                    .writeRecords(resultData)
                    .then(() => {
                      console.log("CSV file has been saved.");
                    })
                    .catch((error) => {
                      console.error(error);
                    });
                }
              };
              verify();
            });
          });

          mailparser.on("end", function () {});
        });

        fetch.once("error", function (err) {
          console.log("Fetch error:", err);
        });

        fetch.once("end", function () {
          imap.end();
        });
      });
    });
  });

  imap.once("error", function (err) {
    console.log("IMAP error:", err);
  });

  imap.once("end", function () {
    console.log("Connection ended");
  });

  imap.connect();
}

module.exports = verifyEmail;
