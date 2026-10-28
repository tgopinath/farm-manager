import { useState } from 'react'
import { router } from 'expo-router'
import { View } from 'react-native'
import { Button, Card, Chip, Empty, Row, Screen, T } from '../components/ui'
import { useCollection } from '../lib/hooks'
import { api } from '../lib/api'
import { speciesEmoji, today, useTheme } from '../lib/theme'

export default function Vaccinations() {
  const t = useTheme()
  const [show, setShow] = useState<'upcoming' | 'given'>('upcoming')
  const vacc = useCollection('vaccinations')
  const animals = useCollection('animals')
  const byId = new Map(animals.data.map((a) => [a.id, a]))

  const rows = vacc.data
    .filter((v) => (show === 'given' ? !!v.givenDate : !v.givenDate))
    .sort((a, b) => (show === 'given' ? String(b.givenDate).localeCompare(String(a.givenDate)) : String(a.dueDate).localeCompare(String(b.dueDate))))

  async function given(id: string) {
    await api.update('vaccinations', id, { givenDate: today() })
    vacc.refresh()
  }

  return (
    <Screen refreshing={vacc.loading} onRefresh={vacc.refresh}>
      <Button title="+ Schedule vaccination" onPress={() => router.push('/edit/vaccinations')} />
      <Row style={{ marginVertical: 12 }}>
        <Chip label="Upcoming" active={show === 'upcoming'} onPress={() => setShow('upcoming')} />
        <Chip label="Given" active={show === 'given'} onPress={() => setShow('given')} />
      </Row>
      {!vacc.loading && rows.length === 0 ? (
        <Empty title={show === 'upcoming' ? 'Nothing scheduled' : 'No doses recorded'} detail="Schedule PPR and ET for goats, FMD and HS for cows, Lasota and Gumboro for chickens. You'll get a phone reminder at 8 am on the day." />
      ) : null}
      {rows.map((v) => {
        const a = byId.get(v.animalId)
        const who = a ? `${speciesEmoji(a.species)} ${a.name || a.tag}` : v.species ? `${speciesEmoji(v.species)} All ${v.species}s` : 'Animals'
        const overdue = !v.givenDate && v.dueDate < today()
        return (
          <Card key={v.id} onPress={() => router.push({ pathname: '/edit/[collection]', params: { collection: 'vaccinations', id: v.id } })}>
            <Row style={{ flexWrap: 'nowrap', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <T bold>💉 {v.vaccine}</T>
                <T muted size={13}>{who}</T>
                <T size={13} bold color={v.givenDate ? t.ok : overdue ? t.danger : t.primary}>
                  {v.givenDate ? `Given ${v.givenDate}` : overdue ? `Overdue since ${v.dueDate}` : `Due ${v.dueDate}`}
                </T>
              </View>
              {!v.givenDate ? <Button small title="Given ✓" onPress={() => given(v.id)} /> : null}
            </Row>
          </Card>
        )
      })}
    </Screen>
  )
}
