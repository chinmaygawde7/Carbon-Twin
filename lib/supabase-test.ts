import { supabase } from './supabase'

export async function testConnection() {
  const { data, error } = await supabase.from('_test').select('*').limit(1)
  if (error && error.code !== 'PGRST205') {
    // PGRST205 = table not found, which is expected and fine — it means we reached Supabase
    console.error('Connection failed:', error.message)
    return false
  }
  console.log('Supabase connection successful')
  return true
}