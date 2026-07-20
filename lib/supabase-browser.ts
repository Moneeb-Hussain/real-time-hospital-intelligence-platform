import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate that we have real Supabase credentials before creating the client.
// Invalid keys cause noisy WebSocket auth failures in the console.
const isValidUrl = url.startsWith('https://') && url.includes('.supabase.co') && !url.includes('placeholder')
const isValidKey = anon.length > 30 && anon.startsWith('eyJ')

let supabaseClient: SupabaseClient | null = null

if (isValidUrl && isValidKey) {
  supabaseClient = createClient(url, anon, {
    realtime: { params: { eventsPerSecond: 10 } }
  })
} else {
  console.info(
    '[supabase-browser] Supabase credentials are not configured or invalid. ' +
    'Realtime subscriptions are disabled. The app will use REST API polling instead.'
  )
}

export const supabase = supabaseClient

export function createRealtimeChannel(channelName: string) {
  if (!supabase) return null
  return supabase.channel(channelName)
}
