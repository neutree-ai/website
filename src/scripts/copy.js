/** The install command copies itself, and says so for a moment. */
const btn = document.getElementById('copy')

if (btn && navigator.clipboard && navigator.clipboard.writeText) {
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(btn.getAttribute('data-cmd')).then(() => {
      btn.textContent = 'Copied'
      setTimeout(() => {
        btn.textContent = 'Copy'
      }, 1600)
    }, () => {})
  })
}
