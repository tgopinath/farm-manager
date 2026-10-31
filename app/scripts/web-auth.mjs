// Adds Google sign-in (public/auth.js) to the exported web app.
import fs from 'node:fs'
const f = new URL('../dist/index.html', import.meta.url)
const html = fs.readFileSync(f, 'utf8')
if (!html.includes('src="/auth.js"')) fs.writeFileSync(f, html.replace('</body>', '<script type="module" src="/auth.js"></script></body>'))
