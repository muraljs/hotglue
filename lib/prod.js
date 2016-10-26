const Koa = require('koa')
const compose = require('koa-compose')
const { uniqueId } = require('lodash')
const path = require('path')
const cheerio = require('cheerio')
const browserify = require('browserify')
const uglifyify = require('uglifyify')
const UglifyJS = require('uglify-js')

const cache = {}

module.exports = (opts) => {
  const app = new Koa()
  const bundleId = uniqueId('hotglue-bundle-')

  // Prepare browserify bundling
  const b = browserify({
    entries: [path.resolve(opts.relative, opts.client.main)],
    transform: [uglifyify].concat(opts.client.transforms || [])
  })
  const bundle = () =>
    new Promise((resolve, reject) => b.bundle((err, buf) => {
      if (err) reject(err)
      else resolve(buf.toString())
    }))

  // Get server
  const server = (
    require(path.resolve(opts.relative, opts.server.main)).default ||
    require(path.resolve(opts.relative, opts.server.main))
  )

  // Return wrapping Koa app
  app.use((ctx, next) => {
    // Stream the client bundle
    if (ctx.url === `/${bundleId}.js`) {
      if (cache[bundleId]) {
        ctx.body = cache[bundleId]
        return
      } else {
        return bundle().then((src) => {
          const minified = UglifyJS.minify(src.toString(), { fromString: true }).code
          ctx.body = cache[bundleId] = minified
        })
      }
    }
    // Mount server app and inject client-side bundle script into head tag
    return compose(server.middleware)(ctx, next).then(() => {
      const $ = cheerio.load(ctx.body)
      if (!$('body').length) return
      $('body').append(`<script src="/${bundleId}.js"></script>`)
      ctx.body = $.html()
    })
  })
  return app
}
