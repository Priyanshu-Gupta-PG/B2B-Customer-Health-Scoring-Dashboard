import app from "./app.mjs";

const PORT = Number(process.env.PORT ?? 4103);
app.listen(PORT, () => {
  console.log(`Product usage mock listening on http://localhost:${PORT}`);
});
