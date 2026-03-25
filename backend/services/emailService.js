const nodemailer = require("nodemailer");

/* CONFIG — replace with your SMTP */

const transporter = nodemailer.createTransport({

host: "smtp.gmail.com", // or Brevo SMTP
port: 587,
secure: false,

auth: {
user: "your_email@gmail.com",
pass: "your_app_password"
}

});


async function sendEmail(to,subject,message){

try{

await transporter.sendMail({
from: '"Digital Detox" <your_email@gmail.com>',
to,
subject,
html: `<p>${message}</p>`
});

}catch(err){

console.error("Email failed:",err);

}

}

module.exports = {
sendEmail
};