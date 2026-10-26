const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xxaquduvirbiratfvfqt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4YXF1ZHV2aXJiaXJhdGZ2ZnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Nzg2MDAsImV4cCI6MjA5NTU1NDYwMH0.mVwTELcYhiXrGAGt9cr1wSRrTiJ62sLwqIa_DVfUwgo';
const supabase = createClient(supabaseUrl, supabaseKey);

const pokeApiUrl = 'https://pokeapi.co/api/v2/pokemon';

function generarHabilidadPorTipo(tipo) {
  switch (tipo.toLowerCase()) {
    case 'fire':
      return 'Quemadura: Resta 30 HP extra al rival.';
    case 'water':
      return 'Curación: Recupera 60 HP del usuario.';
    case 'grass':
      return 'Drenaje: Roba 40 HP de la carta rival.';
    case 'electric':
      return 'Parálisis: Paraliza al rival por 1 turno.';
    case 'psychic':
      return 'Escudo Psíquico: Reduce a la mitad el daño recibido.';
    case 'ice':
      return 'Congelación: Reduce en -20 el ataque del oponente.';
    case 'fighting':
      return 'Furia: Aumenta tu ataque en +30 si el HP es menor a la mitad.';
    case 'poison':
      return 'Veneno: Daña 25 HP por turno al oponente.';
    default:
      return 'Placaje: Inflige 15 HP extra de daño directo.';
  }
}

async function main() {
  console.log("Fetching first 151 Pokémon from PokéAPI...");
  const listRes = await fetch(`${pokeApiUrl}?limit=151`);
  const listData = await listRes.json();
  const results = listData.results;

  const cartasAInsertar = [];
  const batchSize = 25;

  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    console.log(`Fetching details for batch ${i + 1} to ${Math.min(i + batchSize, results.length)}...`);
    const batchPromises = batch.map(p => fetch(p.url).then(r => r.json()));
    const details = await Promise.all(batchPromises);

    for (const d of details) {
      const stats = d.stats;
      const hpBase = stats[0].base_stat;
      const attackBase = stats[1].base_stat;
      const defenseBase = stats[2].base_stat;

      const totalStats = stats.reduce((sum, s) => sum + s.base_stat, 0);
      let rareza = 'Común';
      if (totalStats >= 550) {
        rareza = 'Legendaria';
      } else if (totalStats >= 480) {
        rareza = 'Muy Rara';
      } else if (totalStats >= 400) {
        rareza = 'Rara';
      } else if (totalStats >= 310) {
        rareza = 'Poco Común';
      }

      const tipo1 = d.types[0]?.type.name || 'normal';
      const tipo2 = d.types[1]?.type.name || null;

      const habilidad = generarHabilidadPorTipo(tipo1);
      const nombreFormateado = d.name.charAt(0).toUpperCase() + d.name.slice(1);
      const imagen = d.sprites.other['official-artwork'].front_default || d.sprites.front_default || '';
      const desc = `Un poderoso Pokémon de tipo ${tipo1} originario de la región de Kanto.`;

      cartasAInsertar.push({
        id: d.id, // Explicit ID mapping
        pokemon_id: d.id,
        nombre: nombreFormateado,
        imagen_url: imagen,
        tipo_principal: tipo1,
        tipo_secundario: tipo2,
        puntos_ataque: attackBase * 2,
        puntos_defensa: defenseBase * 2,
        puntos_vida: hpBase * 3,
        habilidad_especial: habilidad,
        nivel_rareza: rareza,
        descripcion_breve: desc
      });
    }
  }

  console.log(`Prepared ${cartasAInsertar.length} cards. Inserting into Supabase...`);
  
  // Clean existing just in case
  const { error: deleteErr } = await supabase.from('cartas').delete().neq('id', 0);
  if (deleteErr) {
    console.error("Error clearing table:", deleteErr.message);
  }

  // Insert in batches of 50 to avoid any timeouts or payloads size issues
  for (let i = 0; i < cartasAInsertar.length; i += 50) {
    const chunk = cartasAInsertar.slice(i, i + 50);
    console.log(`Inserting cards ${i + 1} to ${Math.min(i + 50, cartasAInsertar.length)}...`);
    const { data, error } = await supabase.from('cartas').insert(chunk).select();
    if (error) {
      console.error("Insert error:", error.message);
      throw error;
    }
    console.log(`Inserted chunk successfully.`);
  }

  console.log("Database seeded successfully!");
}

main().catch(err => console.error("Script failed:", err));
