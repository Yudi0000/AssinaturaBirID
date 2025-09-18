import express from 'express';
import bodyParser from 'body-parser';
import { plainAddPlaceholder } from '@signpdf/placeholder-plain';
import crypto from 'crypto';
import pkg from 'node-signpdf'; // ✅ CommonJS import
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { replaceSignature } = require('node-signpdf');

const app = express();

// ↑ Aumenta limite para PDFs grandes
app.use(bodyParser.json({ limit: '50mb' }));

console.log('✅ Inicializando API...');

// ========================
// Endpoint 1: Prepare PDF
// ========================
app.post('/prepare', (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) return res.status(400).json({ error: 'pdfBase64 não enviado' });

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Adiciona placeholder para assinatura
    const pdfWithPlaceholder = plainAddPlaceholder({
      pdfBuffer,
      reason: 'Assinado digitalmente via BirdID',
      signatureLength: 8192, // espaço suficiente para assinatura
    });

    // Calcula hash SHA256 para BirdID
    const hash = crypto.createHash('sha256').update(pdfWithPlaceholder).digest('base64');

    res.json({
      pdfPreparedBase64: pdfWithPlaceholder.toString('base64'),
      hash,
    });
  } catch (err) {
    console.error('Erro em /prepare:', err);
    res.status(500).json({ error: 'Erro ao preparar PDF' });
  }
});

// ========================
// Endpoint 2: Sign PDF
// ========================
app.post('/sign', (req, res) => {
  try {
    const { pdfBase64, rawSignatureBase64 } = req.body;

    // ✅ Validação básica
    if (!pdfBase64 || !rawSignatureBase64) {
      return res.status(400).json({
        error: "pdfBase64 e rawSignatureBase64 são obrigatórios",
        received: req.body
      });
    }

    // Converte base64 para Buffer
    let pdfBuffer, signatureBuffer;
    try {
      pdfBuffer = Buffer.from(pdfBase64, "base64");
    } catch (e) {
      return res.status(400).json({ error: "pdfBase64 inválido", details: e.message });
    }

    try {
      signatureBuffer = Buffer.from(rawSignatureBase64, "base64");
    } catch (e) {
      return res.status(400).json({ error: "rawSignatureBase64 inválido", details: e.message });
    }

    // Substitui placeholder pelo rawSignature
    let signedPdf;
    try {
      signedPdf = replaceSignature(pdfBuffer, signatureBuffer);
    } catch (e) {
      return res.status(500).json({ error: "Falha ao inserir assinatura no PDF", details: e.message });
    }

    // Retorna PDF assinado em base64
    return res.json({
      signedPdfBase64: signedPdf.toString("base64")
    });

  } catch (err) {
    console.error('Erro interno em /sign:', err);
    return res.status(500).json({ error: "Erro interno do servidor", details: err.message });
  }
});

// Porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);

});

