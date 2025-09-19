import express from 'express';
import bodyParser from 'body-parser';
import { plainAddPlaceholder } from '@signpdf/placeholder-plain';
import crypto from 'crypto';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
import utils from '@signpdf/utils';
const { replaceSignature } = utils;
const app = express();
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
    if (!pdfBase64 || !rawSignatureBase64) {
      return res.status(400).json({ error: 'pdfBase64 e rawSignatureBase64 obrigatórios' });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    const signatureBuffer = Buffer.from(rawSignatureBase64, 'base64');

    const signedPdf = replaceSignature(pdfBuffer, signatureBuffer);

    return res.json({
      signedPdfBase64: signedPdf.toString('base64')
    });

  } catch (e) {
    console.error('Erro em /sign:', e);
    return res.status(500).json({ error: 'Falha ao inserir assinatura no PDF', details: e.message });
  }
});

// Porta
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);

});




