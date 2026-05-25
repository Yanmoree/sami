import nodemailer from "nodemailer";
import tls from "tls";

const SMTP_HOST = "server70.hosting.reg.ru";
const SMTP_PORT = 465;
const SMTP_USER = "send@vrevolution.ru";
const SMTP_PASS = "AA123123aa!@123";
const TO_EMAIL = "romanpro0102@gmail.com";

function checkCertificate() {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: SMTP_HOST,
        port: SMTP_PORT,
        servername: SMTP_HOST,
      },
      () => {
        console.log("SSL подключение:", socket.authorized ? "OK" : "ОШИБКА");
        console.log("Причина:", socket.authorizationError || "сертификат валидный");

        const cert = socket.getPeerCertificate();
        console.log("Сертификат выдан для:", cert.subject?.CN);
        console.log("Сертификат выдан кем:", cert.issuer?.CN);

        socket.end();
        resolve();
      }
    );

    socket.on("error", reject);
  });
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

async function main() {
  try {
    await checkCertificate();

    await transporter.verify();
    console.log("SMTP подключение работает");

    const info = await transporter.sendMail({
      from: `"VRevolution" <${SMTP_USER}>`,
      to: TO_EMAIL,
      subject: "Роман барабан",
      html: `
        <h1>Проверка SMTP</h1>
      `,
    });

    console.log("Письмо отправлено:", info.messageId);
  } catch (error) {
    console.error("Ошибка:", error);
  }
}

main();