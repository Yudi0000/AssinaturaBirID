import express from 'express';
import bodyParser from 'body-parser';
import signer from 'node-signpdf';
import { plainAddPlaceholder } from 'node-signpdf/dist/helpers/index.js';

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));

// Endpoint para assinar o PDF
app.post('/sign-pdf', async (req, res) => {
  try {
    const { pdfBase64, rawSignature } = req.body;

    // Converter base64 para Buffer
    let pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Adicionar placeholder para assinatura
    pdfBuffer = plainAddPlaceholder({
      pdfBuffer,
      reason: 'Assinado digitalmente',
      contactInfo: 'email@exemplo.com',
      name: 'Assinador',
      location: 'Brasil',
    });

    // Inserir assinatura no PDF
    const signedPdf = signer.default.sign(
      pdfBuffer,
      Buffer.from(rawSignature, 'base64')
    );

    // Retornar em base64
    res.json({ signedPdf: signedPdf.toString('base64') });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Porta padrão Railway
app.listen(process.env.PORT || 3000, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT || 3000}`);
});
