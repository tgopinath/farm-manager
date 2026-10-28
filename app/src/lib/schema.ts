/**
 * What each kind of record looks like, so one form screen can add and edit
 * all of them.
 */
export type Field = {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'ref'
  options?: { value: string; label: string }[]
  ref?: string // collection for `ref` fields
  required?: boolean
  placeholder?: string
  help?: string
}

const opts = (...pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }))

const species = opts(['goat', 'Goat'], ['cow', 'Cow'], ['chicken', 'Chicken'])

export const SCHEMAS: Record<string, { title: string; fields: Field[]; defaults?: Record<string, any> }> = {
  animals: {
    title: 'Animal',
    defaults: { species: 'goat', status: 'healthy', count: '1' },
    fields: [
      { key: 'species', label: 'Species', type: 'select', options: species, required: true },
      { key: 'name', label: 'Name', type: 'text', placeholder: 'Lakshmi, or "Layer flock A"' },
      { key: 'tag', label: 'Tag / ID', type: 'text', placeholder: 'Ear tag or ring number' },
      { key: 'count', label: 'Head count', type: 'number', help: 'Use 1 for a single animal, more for a flock or herd' },
      { key: 'breed', label: 'Breed', type: 'text', placeholder: 'Boer, Gir, Kadaknath…' },
      { key: 'sex', label: 'Sex', type: 'select', options: opts(['female', 'Female'], ['male', 'Male'], ['mixed', 'Mixed']) },
      { key: 'birthDate', label: 'Birth / arrival date', type: 'date' },
      { key: 'weightKg', label: 'Weight (kg)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: opts(['healthy', 'Healthy'], ['sick', 'Sick'], ['pregnant', 'Pregnant'], ['sold', 'Sold'], ['dead', 'Dead']) },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  health: {
    title: 'Health entry',
    defaults: { kind: 'check' },
    fields: [
      { key: 'animalId', label: 'Animal', type: 'ref', ref: 'animals', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'kind', label: 'Type', type: 'select', options: opts(['check', 'Check-up'], ['treatment', 'Treatment'], ['deworming', 'Deworming'], ['vet', 'Vet visit']) },
      { key: 'summary', label: 'What happened', type: 'textarea', required: true },
      { key: 'cost', label: 'Cost (₹)', type: 'number' },
    ],
  },
  vaccinations: {
    title: 'Vaccination',
    fields: [
      { key: 'vaccine', label: 'Vaccine', type: 'text', required: true, placeholder: 'PPR, FMD, Lasota, HS…' },
      { key: 'animalId', label: 'Animal', type: 'ref', ref: 'animals', help: 'Leave empty to schedule for a whole species' },
      { key: 'species', label: 'Or whole species', type: 'select', options: species },
      { key: 'dueDate', label: 'Due date', type: 'date', required: true },
      { key: 'givenDate', label: 'Given on', type: 'date', help: 'Fill in once done — the reminder stops' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  transactions: {
    title: 'Transaction',
    defaults: { type: 'expense' },
    fields: [
      { key: 'type', label: 'Type', type: 'select', options: opts(['income', 'Income'], ['expense', 'Expense']), required: true },
      { key: 'amount', label: 'Amount (₹)', type: 'number', required: true },
      { key: 'category', label: 'Category', type: 'select', options: opts(['Feed', 'Feed'], ['Medicine', 'Medicine'], ['Vet', 'Vet'], ['Labour', 'Labour'], ['Equipment', 'Equipment'], ['Electricity', 'Electricity'], ['Animal purchase', 'Animal purchase'], ['Milk', 'Milk sale'], ['Eggs', 'Egg sale'], ['Animal sale', 'Animal sale'], ['Meat', 'Meat sale'], ['Manure', 'Manure sale'], ['Other', 'Other']) },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'accountId', label: 'Account', type: 'ref', ref: 'accounts', help: 'Which bank or cash account this came from or went to' },
      { key: 'species', label: 'For', type: 'select', options: species },
      { key: 'note', label: 'Note', type: 'textarea' },
    ],
  },
  accounts: {
    title: 'Account',
    defaults: { openingBalance: '0', minBalance: '0' },
    fields: [
      { key: 'name', label: 'Account name', type: 'text', required: true, placeholder: 'SBI savings, Cash box…' },
      { key: 'openingBalance', label: 'Opening balance (₹)', type: 'number', required: true },
      { key: 'minBalance', label: 'Remind me below (₹)', type: 'number', help: 'You get a reminder when the balance falls under this' },
    ],
  },
  inventory: {
    title: 'Stock item',
    defaults: { category: 'feed', unit: 'kg' },
    fields: [
      { key: 'name', label: 'Item', type: 'text', required: true, placeholder: 'Layer mash, green fodder, mineral mix…' },
      { key: 'category', label: 'Category', type: 'select', options: opts(['feed', 'Feed'], ['medicine', 'Medicine'], ['equipment', 'Equipment'], ['produce', 'Produce (milk, eggs)'], ['other', 'Other']) },
      { key: 'quantity', label: 'Quantity in stock', type: 'number', required: true },
      { key: 'unit', label: 'Unit', type: 'text', placeholder: 'kg, bags, litres, pcs' },
      { key: 'minLevel', label: 'Remind me at or below', type: 'number' },
      { key: 'dailyUse', label: 'Used per day', type: 'number', help: 'Used to warn you a few days before it runs out' },
      { key: 'unitCost', label: 'Cost per unit (₹)', type: 'number' },
    ],
  },
  maintenance: {
    title: 'Maintenance task',
    fields: [
      { key: 'title', label: 'Task', type: 'text', required: true, placeholder: 'Clean water tank, service pump…' },
      { key: 'asset', label: 'Shed / equipment', type: 'text' },
      { key: 'everyDays', label: 'Repeat every (days)', type: 'number' },
      { key: 'lastDone', label: 'Last done', type: 'date' },
      { key: 'dueDate', label: 'Next due (one-off)', type: 'date', help: 'Leave empty for repeating tasks' },
      { key: 'cost', label: 'Typical cost (₹)', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  cameras: {
    title: 'Camera',
    defaults: { kind: 'hls' },
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Goat shed, gate…' },
      { key: 'kind', label: 'Stream type', type: 'select', options: opts(['hls', 'HLS (.m3u8)'], ['mjpeg', 'MJPEG stream'], ['snapshot', 'JPEG snapshot (refreshes)'], ['web', 'Web page / cloud viewer']) },
      { key: 'url', label: 'Stream URL', type: 'text', required: true, placeholder: 'http://192.168.1.20/stream.m3u8' },
      { key: 'location', label: 'Location', type: 'text' },
    ],
  },
}

export const NUMBER_FIELDS = new Set(
  Object.values(SCHEMAS).flatMap((s) => s.fields.filter((f) => f.type === 'number').map((f) => f.key)),
)
