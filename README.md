# hotglue

Mount a certain kind of Koa + Browserify app for hot reloading convenience in development and minified/gzipped/fingerprinted/cached convenience in production. Kind of like the asset pipeline and code reloading bits of Rails.

**NOTE:** Hot reloading code in Node/JS is super hacky, so don't be afraid to refresh your page or restart your server if something is off.

## Example

Wrap a Koa app by specifying the `main` entry points of the server and client, along with which files to `watch` on the server and client for reloading.

```javascript
const hotglue = require('hotglue')

const app = module.exports = hotglue({
  relative: __dirname,
  server: {
    main: 'server.js',
    watch: ['server.js']
  },
  client: {
    main: 'client.js',
    watch: ['client.js']
  }
})

if (require.main === module) {
  app.listen(3000)
  console.log('Listening')
}
```

With this you get...

...in development...

- Websocket hot reloaded server and client-side code

...in production (TBD)...

- Minified + gzipped + fingerprinted + cached JS bundles served by Koa
- Duplicate dependencies b/t bundles extracted into an optimized common bundle
- Bundling occuring in the background while serving un-optimized bundles in the meantime
