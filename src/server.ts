import express from "express";
import bodyParser from "body-parser";
import qrcodeRouter from "./routes/qrcode";

const app = express();
app.use(bodyParser.json({ limit: "1mb" }));

app.use("/api/v1/qrcode", qrcodeRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`QR CODE API listening on http://localhost:${port}`);
});
