const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client if environment variables exist in Vercel
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// Fallback in-memory / JSON reader
let storeMemory = null;
function getFallbackStore() {
  if (storeMemory) return storeMemory;
  try {
    const configPath = path.join(__dirname, '..', 'data', 'config.json');
    const menuPath = path.join(__dirname, '..', 'data', 'menu.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const menu = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
    storeMemory = { config, menu };
  } catch (e) {
    storeMemory = { config: {}, menu: [] };
  }
  return storeMemory;
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET: Fetch live store data from Supabase (or fallback)
  if (req.method === 'GET') {
    if (supabase) {
      try {
        // Fetch config
        const { data: cfgData } = await supabase.from('garage_config').select('config_data').eq('id', 1).single();
        // Fetch menu
        const { data: menuData } = await supabase.from('garage_menu').select('*').order('created_at', { ascending: true });

        if (cfgData && menuData && menuData.length > 0) {
          const formattedMenu = menuData.map(m => ({
            id: m.id,
            name: m.name,
            category: m.category,
            price: Number(m.price),
            description: m.description,
            image: m.image,
            badge: m.badge,
            available: m.available,
            isFavorite: m.is_favorite
          }));

          return res.status(200).json({
            config: cfgData.config_data,
            menu: formattedMenu
          });
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local storage:', err.message);
      }
    }

    return res.status(200).json(getFallbackStore());
  }

  // POST: Update live store data to Supabase (or fallback)
  if (req.method === 'POST') {
    try {
      const { pin, config, menu } = req.body || {};
      const fallback = getFallbackStore();

      const expectedPin = (config && config.adminPin) || fallback.config.adminPin || '1234';
      if (pin !== expectedPin) {
        return res.status(401).json({ error: 'PIN de seguridad incorrecto' });
      }

      if (supabase) {
        // 1. Upsert Config
        if (config) {
          await supabase.from('garage_config').upsert({
            id: 1,
            config_data: config,
            updated_at: new Date().toISOString()
          });
        }

        // 2. Upsert Menu
        if (menu && menu.length > 0) {
          const dbRows = menu.map(m => ({
            id: m.id,
            name: m.name,
            category: m.category,
            price: m.price,
            description: m.description,
            image: m.image,
            badge: m.badge || '',
            available: m.available !== false,
            is_favorite: m.isFavorite === true
          }));

          await supabase.from('garage_menu').upsert(dbRows, { onConflict: 'id' });
        }
      }

      // Update in-memory fallback as well
      if (config) fallback.config = config;
      if (menu) fallback.menu = menu;
      storeMemory = fallback;

      return res.status(200).json({
        success: true,
        message: '¡Ajustes guardados con éxito en Supabase PostgreSQL!',
        data: fallback
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error guardando en Supabase: ' + error.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
