import 'dotenv/config';
import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'node:path';

const app = express();
const port = Number(process.env.PORT || 3000);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowed = new Map([
  ['.pdf', ['application/pdf']],
  ['.jpg', ['image/jpeg']],
  ['.jpeg', ['image/jpeg']],
  ['.png', ['image/png']],
  ['.txt', ['text/plain']]
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const validMime = allowed.get(extension)?.includes(file.mimetype);
    callback(validMime ? null : new Error('Formato não permitido.'), validMime);
  }
});

app.use(express.static('public'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' }
}));

function hasValidSignature(file) {
  const bytes = file.buffer;
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pdf') return bytes.subarray(0, 5).toString('ascii') === '%PDF-';
  if (ext === '.png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (ext === '.jpg' || ext === '.jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return ext === '.txt' && !bytes.subarray(0, Math.min(bytes.length, 4096)).includes(0);
}

function safeName(name) {
  return path.basename(name).replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 120) || 'documento';
}

app.post('/api/print', (req, res) => {
  upload.single('file')(req, res, async (uploadError) => {
    if (uploadError) {
      const message = uploadError.code === 'LIMIT_FILE_SIZE' ? 'O arquivo excede o limite de 10 MB.' : uploadError.message;
      return res.status(400).json({ error: message });
    }
    const file = req.file;
    if (!file || !file.size || !hasValidSignature(file)) {
      return res.status(400).json({ error: 'Arquivo vazio, corrompido ou com formato inválido.' });
    }
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM, PRINTER_EMAIL } = process.env;
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !MAIL_FROM || !PRINTER_EMAIL) {
      return res.status(503).json({ error: 'O serviço de e-mail ainda não foi configurado no servidor.' });
    }
    try {
      const transport = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 465),
        secure: SMTP_SECURE === 'true',
        auth: { user: SMTP_USER, pass: SMTP_PASS }
      });
      await transport.sendMail({
        from: MAIL_FROM,
        to: PRINTER_EMAIL,
        subject: 'Documento para impressão',
        text: 'Segue em anexo o arquivo enviado pelo sistema de impressão.',
        attachments: [{ filename: safeName(file.originalname), content: file.buffer, contentType: file.mimetype }]
      });
      return res.status(200).json({ message: 'Arquivo enviado para impressão com sucesso!' });
    } catch (error) {
      console.error('Falha no envio SMTP:', error.message);
      return res.status(502).json({ error: 'Não foi possível enviar o e-mail agora. Verifique a configuração e tente novamente.' });
    }
  });
});

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.listen(port, () => console.log(`Servidor disponível em http://localhost:${port}`));
