const reloadServer = (text) =>
  window.fetch(window.location.href)
    .then((res) => res.text())
    .then((text) => {
      const el = document.createElement('html')
      el.innerHTML = text
      const html = el.getElementsByTagName('body')[0].innerHTML
      window.document.body.innerHTML = html
    })

const addLoader = () => {
  document.body.innerHTML += `
    <div
      id='hotglue-loader'
      style='
        width: 100%;
        height: 100%;
        position: absolute;
        top: 20px;
        right: 20px;
        width: 10px;
        height: 10px;
        border-radius: 15px;
        background: yellow;
        animation: pulse 0.2s ease-in-out infinite;
        z-index: 2;
      '
    ></div>`
}

const removeLoader = () => {
  document.getElementById('hotglue-loader').remove()
}

const reloadClient = (text) => {
  addLoader()
  return window.fetch(document.querySelector('[src*="{{bundleId}}.js"').src)
    .then((res) => res.text())
    .then((js) => {
      window.eval(js)
      removeLoader()
    })
}

const ws = new window.WebSocket('ws://localhost:1234')

ws.onmessage = (event) => {
  if (event.data === 'reload client') {
    reloadClient()
  } else if (event.data === 'reload server') {
    reloadServer()
  }
}

document.getElementsByTagName('head')[0].innerHTML += `<style>
  @keyframes pulse {
    0% { opacity: 0; }
    50% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>`
