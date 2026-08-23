import { createApp } from "@/app";

const app = createApp();

app.listen(3001, () => {
  console.log("Server is running on http://localhost:3001");
});
