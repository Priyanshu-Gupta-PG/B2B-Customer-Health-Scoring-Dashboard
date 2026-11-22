import app from "./app.mjs";

const PORT = Number(process.env.PORT ?? 4101);
app.listen(PORT, () => {
  console.log(`Stripe mock listening on http://localhost:${PORT}`);
});
