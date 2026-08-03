import ImageKit from "imagekit";
import dotenv from "dotenv";
dotenv.config();

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export const uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No se proporcionó ningún archivo" });
        }

        const file = req.file;

        const result = await imagekit.upload({
            file: file.buffer.toString("base64"), // file buffer to base64
            fileName: file.originalname,
            folder: "/rocketrealtor", // Optional: separate folder in ImageKit
        });

        res.status(200).json({
            success: true,
            url: result.url,
            fileId: result.fileId
        });
    } catch (error) {
        console.error("Error al subir imagen a ImageKit:", error);
        res.status(500).json({ success: false, message: "Error al subir imagen", error: error.message });
    }
};
export const deleteImage = async (req, res) => {
    try {
        const { fileId } = req.params;
        if (!fileId) {
            return res.status(400).json({ success: false, message: "No se proporcionó el fileId" });
        }

        await imagekit.deleteFile(fileId);

        res.status(200).json({
            success: true,
            message: "Imagen eliminada exitosamente"
        });
    } catch (error) {
        console.error("Error al eliminar imagen de ImageKit:", error);
        res.status(500).json({ success: false, message: "Error al eliminar imagen", error: error.message });
    }
};
