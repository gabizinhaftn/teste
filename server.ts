import express from "express";
import path from "path";
import axios from "axios";
import { createServer as createViteServer } from "vite";
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Resend } from 'resend';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
// Mercado Pago Preference
app.post("/api/create-preference", async (req, res) => {
  try {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(500).json({ error: "Token do Mercado Pago não configurado" });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const { items, external_reference } = req.body;
    let appUrl = process.env.APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    if (appUrl && !appUrl.startsWith('http')) {
      appUrl = `https://${appUrl}`;
    }

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: item.id,
          title: item.nome,
          quantity: item.quantidade,
          unit_price: Number(item.preco),
          currency_id: 'BRL'
        })),
        back_urls: {
          success: `${appUrl}/?status=success`,
          failure: `${appUrl}/?status=failure`,
          pending: `${appUrl}/?status=pending`,
        },
        auto_return: 'approved',
        external_reference: external_reference,
      }
    });

    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar preferência de pagamento" });
  }
});

// Email Notification
app.post("/api/notify-status", async (req, res) => {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return res.status(500).json({ error: "Resend key missing" });

    const resend = new Resend(resendKey);
    const { email, orderId, status, cliente } = req.body;

    await resend.emails.send({
      from: 'Axé Canto de Caboclo <onboarding@resend.dev>',
      to: email,
      subject: `Atualização do seu pedido ${orderId}`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <p>Olá <strong>${cliente}</strong>!</p>
          <p>O status do seu pedido <strong>${orderId}</strong> foi atualizado para:</p>
          <h2 style="color: #c5a059;">${status}</h2>
          <p>Acesse o site para acompanhar os detalhes.</p>
          <p>Axé!</p>
        </div>
      `
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao enviar e-mail" });
  }
});

// Rota para Criar Pagamento via PIX (Checkout Transparente)
app.post("/api/create-payment-pix", async (req, res) => {
  try {
    const { items, userEmail } = req.body;
    const totalAmount = items.reduce((acc: number, item: any) => acc + (parseFloat(String(item.preco)) * item.quantidade), 0);
    
    const paymentData = {
      transaction_amount: Number(totalAmount.toFixed(2)),
      description: `Pedido Canto de Caboclo - ${items.map((i: any) => i.nome).join(', ')}`,
      payment_method_id: 'pix',
      payer: {
        email: userEmail || 'contato.nandoxavierdev@gmail.com',
        first_name: 'Cliente',
        last_name: 'Canto de Caboclo',
        identification: {
          type: 'CPF',
          number: '00000000000'
        }
      }
    };

    const response = await axios.post('https://api.mercadopago.com/v1/payments', paymentData, {
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `pix-${Date.now()}`
      }
    });

    res.json({
      id: response.data.id,
      qr_code: response.data.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: response.data.point_of_interaction.transaction_data.qr_code_base64,
      status: response.data.status
    });
  } catch (error: any) {
    console.error('Erro ao gerar PIX:', error.response?.data || error.message);
    res.status(500).json({ error: 'Erro ao gerar pagamento PIX' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen if not running in a serverless environment
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

export default app;
