const Koa = require('koa')
const compose = require('koa-compose')
const chokidar = require('chokidar')
const { forEach, intersection, without, uniqueId } = require('lodash')
const path = require('path')
const cheerio = require('cheerio')
const fs = require('fs')
const browserify = require('browserify')
const watchify = require('watchify')
const ws = require('ws')

const wss = new ws.Server({ port: 1234 })
const fname = path.resolve(__dirname, './client.js')
const reloaderJS = fs.readFileSync(fname, 'utf8')

wss.broadcast = (data) => wss.clients.forEach((client) => client.send(data))

module.exports = (opts) => {
  const app = new Koa()
  const bundleId = uniqueId('hotglue-bundle-')
  const reloader = reloaderJS.replace('{{bundleId}}', bundleId)

  // Prepare watchify cached browserify bundling
  const b = browserify({
    entries: [path.resolve(opts.relative, opts.client.main)],
    cache: {},
    packageCache: {},
    plugin: [watchify],
    transform: opts.client.transforms
  })
  const bundle = () =>
    new Promise((resolve, reject) => b.bundle((err, buf) => {
      if (err) reject(err)
      else resolve(buf.toString())
    }))

  // Swap out reloaded server instance on server file change
  const getServer = () =>
    require(path.resolve(opts.relative, opts.server.main)).default ||
    require(path.resolve(opts.relative, opts.server.main))
  const reloadServer = () => {
    forEach(require.cache, (v, k) => {
      if (!k.match('node_modules')) delete require.cache[k]
    })
    server = getServer()
  }
  let server = getServer()

  // Watch for file changes and swap out the hot-mounted server instance,
  // or re-eval the client-side bundle in the browser
  without(opts.server.watch, ...opts.client.watch).forEach((glob) => {
    chokidar.watch(opts.relative + '/' + glob).on('change', () => {
      reloadServer()
      wss.broadcast('reload server')
    })
  })
  without(opts.client.watch, ...opts.server.watch).forEach((glob) => {
    chokidar.watch(opts.relative + '/' + glob).on('change', () => {
      bundle().then(() => wss.broadcast('reload client'))
    })
  })
  intersection(opts.server.watch, opts.client.watch).forEach((glob) => {
    chokidar.watch(opts.relative + '/' + glob).on('change', () => {
      reloadServer()
      bundle().then(() => wss.broadcast('reload client'))
    })
  })

  // Mount hotloading middleware
  app.use((ctx, next) => {
    // Serve the client bundle
    if (ctx.url === `/${bundleId}.js`) {
      return bundle().then((js) => { ctx.body = js })
    }
    // Mount server app and inject reloader and client-side bundle
    // script into head tag
    return compose(server.middleware)(ctx, next).then(() => {
      if (!ctx.body) return
      const $ = cheerio.load(ctx.body)
      if (!$('body').length) return
      $('body').append(`<script>${reloader}</script>`)
      $('body').append(`<script src="/${bundleId}.js"></script>`)
      ctx.body = $.html()
    })
  })
  return app
}
