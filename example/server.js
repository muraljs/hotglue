const Koa = require('koa')
const app = module.exports = new Koa()

app.use((ctx) => {
  ctx.body = `
    <html>
      <body>
        <div id="server">
          Change {{this}} on the server and watch it live
        </div>
        <div id="client">
        </div>
      </body>
    </html>
  `
})