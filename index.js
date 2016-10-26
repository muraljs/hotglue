const { NODE_ENV } = process.env

module.exports = NODE_ENV === 'development'
  ? require('./lib/dev')
  : require('./lib/prod')
