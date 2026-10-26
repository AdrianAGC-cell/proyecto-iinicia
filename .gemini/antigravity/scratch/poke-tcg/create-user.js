const { createClient } = require('@supabase/supabase-js');
const url = 'https://xxaquduvirbiratfvfqt.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YXF1ZHV2aXJiaXJhdGZ2ZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Nzg2MDAsImV4cCI6MjA5NTU1NDYwMH0.mVwTELcYhiXrGAGt9cr1wSRrTiJ62sLwqIa_DVfUwgo';
const supabase = createClient(url, key);

async function main() {
  const email = 'entrenador_pokemon@gmail.com';
  const password = 'password123';
  const username = 'EntrenadorPokemon';

  console.log("Iniciando sesión:", email);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (authErr) {
    console.error("SignIn error:", authErr.message);
    return;
  }
  
  if (authData.user) {
    console.log("Usuario logueado:", authData.user.id);
    
    // Verificar si el perfil se creó automáticamente, sino crearlo
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
    if (!prof) {
      const { error: profErr } = await supabase.from('profiles').insert([
        { id: authData.user.id, username, email }
      ]);
      console.log("Profile insert:", profErr ? profErr.message : "OK");
    } else {
      console.log("Profile ya existe");
    }
    
    // Seed cartas if needed? Let's just create the deck
    const { error: deckErr } = await supabase.from('coleccion_usuario').insert([
      { usuario_id: authData.user.id, carta_id: 1, cantidad_copias: 4 }, // We don't know real IDs, so this might fail if foreign key to cartas fails, wait!
    ]);
    console.log("Coleccion insert:", deckErr ? deckErr.message : "OK");
  }
}
main();
