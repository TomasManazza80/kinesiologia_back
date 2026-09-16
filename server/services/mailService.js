import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for port 465
    auth: {
        user: process.env.SMTP_USER, // Tu correo personal de Gmail
        pass: process.env.SMTP_PASS  // Tu "Contraseña de Aplicación" de Google
    }
});

export const sendEmail = async (to, subject, html) => {
    try {
        const info = await transporter.sendMail({
            from: `"Realtor Rocket" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            html: html
        });
        
        console.log("Correo enviado exitosamente: %s", info.messageId);
        return { success: true, data: info };
    }
    catch (error) {
        console.error("Error al enviar el correo:", error);
        throw error;
    }
};
