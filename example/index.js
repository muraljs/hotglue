const hotglue = require('../')

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
