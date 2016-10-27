/* eslint-env mocha */
const app = require('./example')
const Browser = require('zombie')
const fs = require('fs')
const path = require('path')

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

// Client helpers
const clientPath = path.resolve(__dirname, 'example/client.js')
const clientCode = `
document.getElementById('client')
  .innerHTML = 'Change {{this}} on the client and watch it live'
`.trim()
const updateClient = (rep) => {
  fs.writeFileSync(clientPath, clientCode.replace('{{this}}', rep))
}

// Server helpers
const serverPath = path.resolve(__dirname, 'example/server.js')
const serverCode = `
const Koa = require('koa')
const app = module.exports = new Koa()

app.use((ctx) => {
  ctx.body = \`
    <html>
      <body>
        <div id="server">
          Change {{this}} on the server and watch it live
        </div>
        <div id="client">
        </div>
      </body>
    </html>
  \`
})
`.trim()
const updateServer = (rep) => {
  fs.writeFileSync(serverPath, serverCode.replace('{{this}}', rep))
}

describe('hotglue', () => {
  let server

  before((done) => {
    server = app.listen(5000, done)
  })

  after(() => {
    server.close()
  })

  afterEach(() => {
    updateClient('{{this}}')
    updateServer('{{this}}')
  })

  it('reloads client code on changes', () => {
    const browser = new Browser()
    return browser.visit('http://localhost:5000').then(() => {
      browser.assert.text('#client',
        'Change {{this}} on the client and watch it live')
      updateClient('foo')
      return sleep(500).then(() =>
        browser.assert.text('#client',
          'Change foo on the client and watch it live')
      )
    })
  })

  it('reloads server code on changes', () => {
    const browser = new Browser()
    return browser.visit('http://localhost:5000').then(() => {
      browser.assert.text('#server',
        'Change {{this}} on the server and watch it live')
      updateServer('foo')
      return sleep(500).then(() =>
        browser.visit('http://localhost:5000').then(() =>
          browser.assert.text('#server',
            'Change foo on the server and watch it live')))
    })
  })

  it('handles missing body', () => {
    fs.writeFileSync(serverPath, `
      const Koa = require('koa')
      const app = module.exports = new Koa()

      app.use((ctx) => { ctx.body = '' })
    `.trim())
    const browser = new Browser()
    return sleep(500).then(() =>
      browser.visit('http://localhost:5000').then(() => {
        console.log(browser.html())
      }))
  })
})
