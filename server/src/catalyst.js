/**
 * Zoho Catalyst Data Store, over its REST API.
 *
 * The table is `farm_records` (override with FARM_CATALYST_TABLE):
 *   collection  varchar(50)
 *   rec_id      varchar(64)
 *   data        text
 * plus Catalyst's own ROWID / CREATEDTIME / MODIFIEDTIME.
 *
 * AppSail rejects env variables that start with `CATALYST_`, so everything
 * here is read from `FARM_CATALYST_*`.
 */
const env = (k) => (process.env[`FARM_CATALYST_${k}`] ?? '').trim()
const DC = (process.env.ZOHO_DC ?? 'in').replace(/^\./, '')
const TIMEOUT = 20000

function config() {
  return {
    projectId: env('PROJECT_ID'),
    table: env('TABLE') || 'farm_records',
    clientId: env('CLIENT_ID'),
    clientSecret: env('CLIENT_SECRET'),
    refreshToken: env('REFRESH_TOKEN'),
    environment: /^prod/i.test(env('ENV')) ? 'Production' : 'Development',
    api: `https://api.catalyst.zoho.${DC}`,
    accounts: `https://accounts.zoho.${DC}`,
  }
}

export function ready() {
  const c = config()
  return !!(c.projectId && c.clientId && c.clientSecret && c.refreshToken)
}

let token = { access: null, until: 0 }

async function accessToken() {
  if (token.access && token.until > Date.now()) return token.access
  const c = config()
  const res = await fetch(`${c.accounts}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: c.refreshToken,
      client_id: c.clientId,
      client_secret: c.clientSecret,
    }).toString(),
    signal: AbortSignal.timeout(TIMEOUT),
  })
  // Zoho answers 200 with an `error` field rather than an HTTP error code.
  const data = await res.json().catch(() => ({}))
  if (data.error || !data.access_token) throw new Error(`Catalyst token refused (${data.error ?? res.status})`)
  token = { access: data.access_token, until: Date.now() + (Number(data.expires_in ?? 3600) - 60) * 1000 }
  return token.access
}

async function call(path, init = {}) {
  const c = config()
  const res = await fetch(`${c.api}/baas/v1/project/${c.projectId}/table/${c.table}${path}`, {
    ...init,
    headers: {
      Authorization: `Zoho-oauthtoken ${await accessToken()}`,
      'Content-Type': 'application/json',
      ENVIRONMENT: c.environment,
    },
    signal: AbortSignal.timeout(TIMEOUT),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.status === 'failure') {
    throw new Error(`Catalyst: ${body?.data?.message ?? body?.message ?? res.status}`)
  }
  return body
}

/** Every row, following Catalyst's next_token pagination. */
export async function allRows() {
  const rows = []
  let next = null
  do {
    const body = await call(`/row?max_rows=300${next ? `&next_token=${encodeURIComponent(next)}` : ''}`)
    rows.push(...(body.data ?? []))
    next = body.more_records ? body.next_token : null
  } while (next)
  return rows
}

export async function insertRow(collection, recId, data) {
  const body = await call('/row', { method: 'POST', body: JSON.stringify([{ collection, rec_id: recId, data }]) })
  return body.data?.[0]?.ROWID
}

export async function updateRow(rowId, data) {
  await call('/row', { method: 'PATCH', body: JSON.stringify([{ ROWID: rowId, data }]) })
}

export async function deleteRow(rowId) {
  await call(`/row/${rowId}`, { method: 'DELETE' })
}
