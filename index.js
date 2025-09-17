import express from "express";
import bodyParser from "body-parser";
import pkg from "@signpdf/signpdf"; // importa o módulo inteiro
const { plainAddPlaceholder, sign } = pkg;

import forge from "node-forge";
import crypto from "crypto";

const app = express();
app.use(bodyParser.json({ limit: "15mb" }));

// 1️⃣ Preparar PDF para assinatura (adiciona placeholder)
app.post("/prepare", (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) return res.status(400).json({ error: "pdfBase64 é obrigatório" });

    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    // adiciona placeholder para assinatura
    const pdfWithPlaceholder = plainAddPlaceholder({
      pdfBuffer,
      reason: "Assinado digitalmente via BirdID",
      signatureLength: 8192
    });

    // calcula hash SHA256 (enviar para BirdID)
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

// 2️⃣ Assinar PDF com assinatura recebida do BirdID
app.post("/sign", (req, res) => {
  try {
    const { pdfPreparedBase64, rawSignatureBase64 } = req.body;
    if (!pdfPreparedBase64 || !rawSignatureBase64) return res.status(400).json({ error: "Campos obrigatórios faltando" });

    const pdfBuffer = Buffer.from(pdfPreparedBase64, "base64");
    const signatureBuffer = Buffer.from(rawSignatureBase64, "base64");

    // substitui placeholder pela assinatura real
    const signedPdf = sign(pdfBuffer, signatureBuffer);

    res.json({ pdfSignedBase64: signedPdf.toString("base64") });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao assinar PDF" });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 API rodando");
});
