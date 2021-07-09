import nodemailer from 'nodemailer';

class Mail {
    mailOption() {
        const data = {
            logger: true,
            host: process.env.MAIL_SMTP_SERVER,
            port: process.env.MAIL_PORT,
            secure: false,
            auth: {
                user: process.env.MAIL_SMTP_USERNAME,
                pass: process.env.MAIL_SMTP_PASSWORD,
            },
            debug: true,
        };

        return data;
    }
    async send(to: string, subject: string, text: string) {
        const options: any = this.mailOption();
        let transporter = nodemailer.createTransport(options);
        let message = {
            from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_SMTP_USERNAME}>`,
            to,
            subject,
            text,
        };
        let info = await transporter.sendMail(message);
        console.log('Message sent successfully as %s', info.messageId);
        return info;
    }
}

export default new Mail();
