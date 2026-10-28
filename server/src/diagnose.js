/**
 * Sick-animal screening from a photo, using Claude's vision.
 *
 * This is a screening aid, not a diagnosis: it reports what is visible in the
 * picture and how urgently a vet should look. The prompt says so, and the
 * app shows that caveat next to every result.
 */
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'

const MODEL = process.env.FARM_AI_MODEL || 'claude-opus-5'

export const Assessment = z.object({
  animalVisible: z.boolean().describe('Whether a goat, cow or chicken is clearly visible'),
  species: z.enum(['goat', 'cow', 'chicken', 'other', 'unknown']),
  status: z.enum(['looks_healthy', 'possible_concern', 'likely_sick', 'urgent']),
  confidence: z.enum(['low', 'medium', 'high']),
  signs: z.array(z.object({
    sign: z.string().describe('A visible sign, e.g. "nasal discharge", "hunched posture"'),
    where: z.string().describe('Body area'),
  })),
  possibleConditions: z.array(z.string()).describe('Common conditions consistent with the signs, most likely first'),
  advice: z.array(z.string()).describe('Practical next steps for the farmer'),
  callVet: z.boolean(),
  summary: z.string().describe('One or two plain sentences for the farmer'),
})

const SYSTEM = `You help small farmers in India screen goats, cows and chickens for illness from a phone or CCTV photo.

Look only at what is visible: body condition, posture, coat or feathers, eyes, nose, mouth, legs and hooves or feet, skin lesions, swelling, wounds, discharge, droppings in view, and the animal's surroundings.

Be honest about the limits of a single photo. If the image is blurry, too dark, or no animal is visible, say so with low confidence rather than guessing. You are a screening aid, not a vet: when anything suggests a contagious disease (e.g. foot-and-mouth, PPR, lumpy skin, Newcastle disease, avian influenza), sudden deaths, bleeding, inability to stand, or labour difficulty, set callVet to true and status to urgent.

Write advice a farmer can act on today, in simple English.`

let client = null
export const aiReady = () => !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN)

export async function diagnose({ imageBase64, mediaType = 'image/jpeg', species, notes }) {
  client ??= new Anthropic()
  const context = [
    species ? `The farmer says this is a ${species}.` : null,
    notes ? `Farmer's notes: ${notes}` : null,
    'Assess this animal\'s visible health.',
  ].filter(Boolean).join('\n')

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
        { type: 'text', text: context },
      ],
    }],
    output_config: { effort: 'medium', format: betaZodOutputFormat(Assessment) },
  })

  if (response.stop_reason === 'refusal') throw Object.assign(new Error('The photo could not be assessed.'), { status: 422 })
  if (!response.parsed_output) throw Object.assign(new Error('The assessment came back incomplete. Try again.'), { status: 502 })
  return { ...response.parsed_output, model: response.model }
}
