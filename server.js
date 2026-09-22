const express = require('express');

const app = express();
const port = 3000;

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

app.post('/cart/add', (request, response) => {
  response.json({ ok: true, items: 1 });
});

app.get('/report', async (request, response) => {
  await sleep(200 + Math.random() * 200);
  response.json({ rows: 20000 });
});

app.post('/pay', (request, response) => {
  if (Math.random() < 0.05) {
    return response.status(500).json({ error: 'gateway timeout' });
  }

  return response.json({ paid: true });
});

app.listen(port, () => {
  console.log(`API: http://localhost:${port}`);
});
