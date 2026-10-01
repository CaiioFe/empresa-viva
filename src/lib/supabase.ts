import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chavePublica = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !chavePublica) {
  throw new Error(
    'Faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. Copie .env.example para .env.local e preencha com a URL e a chave pública.',
  )
}

/**
 * Cliente do Supabase com a chave pública, apontado para o schema empresa_viva.
 * A trava de acesso (RLS) decide o que cada usuário vê.
 */
export const supabase = createClient(url, chavePublica, {
  db: { schema: 'empresa_viva' },
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'empresa-viva-sessao' },
})
