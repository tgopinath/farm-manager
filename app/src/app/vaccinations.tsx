import { useState } from 'react'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Badge, Button, Chip, Empty, List, ListRow, Row, Screen, T, useToast } from '../components/ui'
import { useCollection } from '../lib/hooks'
import { api } from '../lib/api'
import { niceDate, speciesEmoji, today } from '../lib/theme'

export default function Vaccinations() {
  const toast = useToast()
  const [show, setShow] = useState<'upcoming' | 'given'>('upcoming')
  const vacc = useCollection('vaccinations')
  const animals = useCollection('animals')
  const byId = new Map(animals.data.map((a) => [a.id, a]))

  const upcoming = vacc.data.filter((v) => !v.givenDate)
  const rows = vacc.data
    .filter((v) => (show === 'given' ? !!v.givenDate : !v.givenDate))
    .sort((a, b) => (show === 'given' ? String(b.givenDate).localeCompare(String(a.givenDate)) : String(a.dueDate).localeCompare(String(b.dueDate))))

  async function given(id: string, name: string) {
    await api.update('vaccinations', id, { givenDate: today() })
    vacc.refresh()
    toast(`${name} marked as given`, { label: 'Undo', onPress: async () => { await api.update('vaccinations', id, { givenDate: '' }); vacc.refresh() } })
  }

  return (
    <Screen refreshing={vacc.loading} onRefresh={vacc.refresh} max={760}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 18 }}>
        <Row>
          <Chip label="Upcoming" count={upcoming.length} active={show === 'upcoming'} onPress={() => setShow('upcoming')} />
          <Chip label="Given" count={vacc.data.length - upcoming.length} active={show === 'given'} onPress={() => setShow('given')} />
        </Row>
        <Button small icon="add" title="Schedule" onPress={() => router.push('/edit/vaccinations')} />
      </Row>
      {!vacc.loading && rows.length === 0 ? (
        <Empty icon="💉" title={show === 'upcoming' ? 'Nothing scheduled' : 'No doses recorded'} detail="Schedule PPR and ET for goats, FMD and HS for cows, Lasota and Gumboro for chickens. Your phone reminds you at 8 am on the day." />
      ) : (
        <List>
          {rows.map((v) => {
            const a = byId.get(v.animalId)
            const who = a ? `${speciesEmoji(a.species)} ${a.name || a.tag}` : v.species ? `${speciesEmoji(v.species)} All ${v.species}s` : 'Animals'
            const overdue = !v.givenDate && v.dueDate < today()
            return (
              <ListRow
                key={v.id}
                onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'vaccinations', id: v.id } })}
                trailing={!v.givenDate ? <Button small kind={overdue ? 'primary' : 'secondary'} icon="checkmark" title="Given" onPress={() => given(v.id, v.vaccine)} /> : null}
              >
                <View style={{ gap: 3 }}>
                  <T bold size={16}>{v.vaccine}</T>
                  <T muted size={13.5}>{who}</T>
                  <Badge label={v.givenDate ? `Given ${niceDate(v.givenDate)}` : overdue ? `Overdue since ${niceDate(v.dueDate)}` : `Due ${niceDate(v.dueDate)}`} tone={v.givenDate ? 'ok' : overdue ? 'danger' : 'info'} dot />
                </View>
              </ListRow>
            )
          })}
        </List>
      )}
    </Screen>
  )
}
