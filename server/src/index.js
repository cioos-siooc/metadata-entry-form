const { buildApp } = require("./app");
const config = require("./config");

const app = buildApp();

app.listen({ port: config.port, host: config.host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
