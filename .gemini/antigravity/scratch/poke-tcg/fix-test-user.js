const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xxaquduvirbiratfvfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YXF1ZHV2aXJiaXJhdGZ2ZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Nzg2MDAsImV4cCI6MjA5NTU1NDYwMH0.mVwTELcYhiXrGAGt9cr1wSRrTiJ62sLwqIa_DVfUwgo';
const supabase = createClient(supabaseUrl, supabaseKey);

const userId = 'f3aeab1e-8d87-4fec-a1ff-fbb8da1afe32';

async function main() {
  console.log("Fixing test user state...");

  // Sign in to authenticate the session for RLS compliance
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'entrenador_pokemon@gmail.com',
    password: 'password123'
  });
  if (authErr) throw authErr;
  console.log("Logged in successfully as:", authData.user.email);

  // 1. Get cards
  const { data: cartas, error: cartasError } = await supabase
    .from('cartas')
    .select('*')
    .order('id', { ascending: true });

  if (cartasError) throw cartasError;
  console.log(`Loaded ${cartas.length} cards from database.`);

  const basicIds = [1, 4, 7, 25, 10, 13, 16, 19, 27, 74];
  const cartasBasicas = cartas.filter(c => basicIds.includes(c.pokemon_id));

  if (cartasBasicas.length === 0) {
    const comunes = cartas.filter(c => c.nivel_rareza === 'Común').slice(0, 10);
    cartasBasicas.push(...comunes);
  }

  console.log(`Using ${cartasBasicas.length} basic cards for initial collection.`);

  // 2. Prep collection
  const cartasParaColeccion = cartasBasicas.map(c => ({
    usuario_id: userId,
    carta_id: c.id,
    cantidad_copias: 4
  }));

  // Clean existing collection for this user first
  await supabase.from('coleccion_usuario').delete().eq('usuario_id', userId);

  // Insert into collection
  const { error: colError } = await supabase
    .from('coleccion_usuario')
    .insert(cartasParaColeccion);

  if (colError) throw colError;
  console.log("Collection successfully added.");

  // 3. Create active deck
  // Clean existing decks for this user first
  const { data: oldDecks } = await supabase.from('mazos').select('id').eq('usuario_id', userId);
  if (oldDecks && oldDecks.length > 0) {
    const deckIds = oldDecks.map(d => d.id);
    await supabase.from('mazo_cartas').delete().in('mazo_id', deckIds);
    await supabase.from('mazos').delete().eq('usuario_id', userId);
  }

  // Create new active deck
  const { data: mazo, error: mazoError } = await supabase
    .from('mazos')
    .insert({
      usuario_id: userId,
      nombre: 'Mazo Principal',
      es_mazo_activo: true
    })
    .select()
    .single();

  if (mazoError) throw mazoError;
  console.log("Active deck created.");

  // 4. Save cards in deck (2 copies of each)
  const cartasParaMazo = cartasBasicas.map(c => ({
    mazo_id: mazo.id,
    carta_id: c.id,
    cantidad: 2
  }));

  const { error: mazoCartasError } = await supabase
    .from('mazo_cartas')
    .insert(cartasParaMazo);

  if (mazoCartasError) throw mazoCartasError;
  console.log("Deck cards saved successfully.");

  // 5. Update user profile to have some initial points if they don't have enough
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ puntos: 150 })
    .eq('id', userId);

  if (profileError) throw profileError;
  console.log("Profile points updated to 150.");

  console.log("Test user fixed successfully!");
}

main().catch(err => console.error("Error fixing user:", err));
