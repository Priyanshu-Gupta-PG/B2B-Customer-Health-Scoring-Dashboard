import app from "./app.mjs";

const PORT = Number(process.env.PORT ?? 4102);
app.listen(PORT, () => {
  console.log(`Zendesk mock listening on http://localhost:${PORT}`);
});
