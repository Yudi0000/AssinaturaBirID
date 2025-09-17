import express from 'express';
import bodyParser from 'body-parser';
import pkg from '@signpdf/signpdf';
const { sign } = pkg;
import placeholderPkg from '@signpdf/placeholder-plain';
const { plainAddPlaceholder } = placeholderPkg;
import crypto from 'crypto';

const app = express();

// ↑ Aumenta limite para PDFs grandes
app.use(bodyParser.json({ limit: '20mb' }));

// Logs de inicialização
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
      signatureLength: 8192,
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
    const { pdfPreparedBase64, rawSignatureBase64 } = req.body;
    if (!pdfPreparedBase64 || !rawSignatureBase64)
      return res.status(400).json({ error: 'Dados insuficientes' });

    const pdfBuffer = Buffer.from(pdfPreparedBase64, 'base64');
    const signatureBuffer = Buffer.from(rawSignatureBase64, 'base64');

    // Assina PDF
    const signedPdf = sign(pdfBuffer, signatureBuffer);

    res.json({ pdfSignedBase64: signedPdf.toString('base64') });
  } catch (err) {
    console.error('Erro em /sign:', err);
    res.status(500).json({ error: 'Erro ao assinar PDF' });
  }
});

// ========================
// Inicialização
// ========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 API rodando na porta ${PORT}`));
