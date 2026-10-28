// Fills a running server with a small sample farm: node seed.mjs [url]
const base = (process.argv[2] ?? 'http://localhost:4600') + '/api'
const post = async (c, d) => (await fetch(`${base}/${c}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })).json()
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

const sbi = await post('accounts', { name: 'SBI savings', openingBalance: 42000, minBalance: 15000 })
const cash = await post('accounts', { name: 'Cash box', openingBalance: 3000, minBalance: 2000 })
const lakshmi = await post('animals', { species: 'goat', name: 'Lakshmi', tag: 'G-014', breed: 'Boer', sex: 'female', status: 'pregnant', birthDate: '2024-03-10', weightKg: 38, count: 1 })
const raja = await post('animals', { species: 'goat', name: 'Raja', tag: 'G-002', breed: 'Jamunapari', sex: 'male', status: 'sick', birthDate: '2023-01-05', weightKg: 52, count: 1, notes: 'Coughing since Monday' })
await post('animals', { species: 'goat', name: 'Kid group', breed: 'Mixed', sex: 'mixed', status: 'healthy', count: 9 })
const gauri = await post('animals', { species: 'cow', name: 'Gauri', tag: 'C-01', breed: 'Gir', sex: 'female', status: 'healthy', birthDate: '2021-07-01', weightKg: 380, count: 1 })
await post('animals', { species: 'cow', name: 'Nandi', tag: 'C-02', breed: 'Sahiwal', sex: 'male', status: 'healthy', count: 1 })
await post('animals', { species: 'chicken', name: 'Layer flock A', breed: 'BV-380', sex: 'female', status: 'healthy', count: 120 })
await post('animals', { species: 'chicken', name: 'Country chickens', breed: 'Kadaknath', sex: 'mixed', status: 'healthy', count: 35 })

await post('vaccinations', { vaccine: 'PPR', species: 'goat', dueDate: day(-2) })
await post('vaccinations', { vaccine: 'Lasota (ND)', species: 'chicken', dueDate: day(3) })
await post('vaccinations', { vaccine: 'FMD', animalId: gauri.id, dueDate: day(20) })
await post('vaccinations', { vaccine: 'ET', animalId: lakshmi.id, dueDate: day(-30), givenDate: day(-30) })

await post('inventory', { name: 'Layer mash', category: 'feed', quantity: 45, unit: 'kg', minLevel: 30, dailyUse: 14, unitCost: 32 })
await post('inventory', { name: 'Green fodder', category: 'feed', quantity: 600, unit: 'kg', minLevel: 150, dailyUse: 45 })
await post('inventory', { name: 'Goat pellets', category: 'feed', quantity: 120, unit: 'kg', minLevel: 40, dailyUse: 6, unitCost: 28 })
await post('inventory', { name: 'Mineral mixture', category: 'medicine', quantity: 4, unit: 'kg', minLevel: 2 })
await post('inventory', { name: 'Eggs in store', category: 'produce', quantity: 180, unit: 'pcs' })

await post('maintenance', { title: 'Clean water tank', asset: 'Main tank', everyDays: 30, lastDone: day(-27) })
await post('maintenance', { title: 'Service borewell pump', asset: 'Pump', dueDate: day(-1), cost: 1500 })
await post('maintenance', { title: 'Lime wash poultry shed', asset: 'Shed B', everyDays: 90, lastDone: day(-40) })

const tx = [
  ['income', 9600, 'Eggs', -3, sbi.id, 'chicken'], ['income', 14200, 'Milk', -5, sbi.id, 'cow'],
  ['income', 18000, 'Animal sale', -12, sbi.id, 'goat'], ['expense', 22400, 'Feed', -8, sbi.id],
  ['expense', 1800, 'Vet', -2, cash.id, 'goat'], ['expense', 12000, 'Labour', -1, sbi.id],
  ['expense', 2300, 'Electricity', -6, sbi.id], ['expense', 900, 'Medicine', -4, cash.id],
  ['expense', 14500, 'Feed', -35, sbi.id], ['income', 15800, 'Milk', -36, sbi.id, 'cow'],
]
for (const [type, amount, category, d, accountId, species] of tx) await post('transactions', { type, amount, category, date: day(d), accountId, species })

await post('health', { animalId: raja.id, date: day(-2), kind: 'vet', summary: 'Vet visit: mild respiratory infection. Oxytetracycline for 5 days.', cost: 600 })
await post('cameras', { name: 'Goat shed', kind: 'hls', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', location: 'Shed A (demo stream)' })
console.log('Seeded sample farm at', base)
