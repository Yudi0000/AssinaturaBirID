import express from "express";
import bodyParser from "body-parser";
import { plainAddPlaceholder, replaceSignature } from "node-signpdf";
import crypto from "crypto";

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));

// 1. Preparar PDF para assinatura
app.post("/prepare", (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // adiciona o placeholder
    const pdfWithPlaceholder = plainAddPlaceholder({
      pdfBuffer,
      reason: "Assinado digitalmente via BirdID",
      signatureLength: 8192,
    });

    // calcula hash SHA256 (é isso que você manda para BirdID)
    const hash = crypto.createHash("sha256").update(pdfWithPlaceholder).digest("base64");

    res.json({
      pdfPreparedBase64: pdfWithPlaceholder.toString("base64"),
      hash
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao preparar PDF" });
  }
});

// 2. Inserir assinatura no PDF
app.post("/sign", (req, res) => {
  try {
    const { pdfPreparedBase64, rawSignatureBase64 } = req.body;

    const pdfBuffer = Buffer.from(pdfPreparedBase64, "base64");
    const signatureBuffer = Buffer.from(rawSignatureBase64, "base64");

    const signedPdf = replaceSignature(pdfBuffer, signatureBuffer);

    res.json({ pdfSignedBase64: signedPdf.toString("base64") });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao assinar PDF" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 API rodando");
});

