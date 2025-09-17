import express from 'express';
import bodyParser from 'body-parser';
import pkg from '@signpdf/signpdf';
const { sign } = pkg;

import placeholderPkg from '@signpdf/placeholder-plain';
const { plainAddPlaceholder } = placeholderPkg;

import crypto from 'crypto';

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/prepare', (req, res) => {
  try {
    const { pdfBase64 } = req.body;
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    const pdfWithPlaceholder = plainAddPlaceholder({
      pdfBuffer,
      reason: 'Assinado digitalmente via BirdID',
      signatureLength: 8192,
    });

    const hash = crypto.createHash('sha256').update(pdfWithPlaceholder).digest('base64');

    res.json({
      pdfPreparedBase64: pdfWithPlaceholder.toString('base64'),
      hash,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao preparar PDF' });
  }
});

app.post('/sign', (req, res) => {
  try {
    const { pdfPreparedBase64, rawSignatureBase64 } = req.body;

    const pdfBuffer = Buffer.from(pdfPreparedBase64, 'base64');
    const signatureBuffer = Buffer.from(rawSignatureBase64, 'base64');

    const p12Buffer = fs.readFileSync('path/to/your/certificate.p12');
    const signer = new P12Signer(p12Buffer, 'your-password');
    const signedPdf = sign(pdfBuffer, signer);

    res.json({ pdfSignedBase64: signedPdf.toString('base64') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao assinar PDF' });
  }
});

app.listen(3000, () => {
  console.log('🚀 API rodando');
});

