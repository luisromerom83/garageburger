const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const postgres = require('postgres');
const { kv } = require('@vercel/kv');
const { get: getEdgeConfig } = require('@vercel/edge-config');

// 1. Supabase Environment Detection (Direct or via Vercel Integration)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.POSTGRES_URL_NON_POOLING;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey && supabaseUrl.includes('supabase')) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// 2. Vercel Postgres Pool (POSTGRES_URL)
let sql = null;
if (process.env.POSTGRES_URL) {
  try {
    sql = postgres(process.env.POSTGRES_URL, { ssl: 'require' });
  } catch (e) {
    console.warn('Vercel Postgres connection warning:', e.message);
  }
}

// 3. Static JSON Fallback
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

  // GET: Fetch live store data from Vercel KV / Edge Config / Supabase / Vercel Postgres / Fallback
  if (req.method === 'GET') {
    // A. Try Vercel KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const kvStore = await kv.get('garage_store_data');
        if (kvStore && kvStore.config && kvStore.menu) {
          return res.status(200).json(kvStore);
        }
      } catch (err) {
        console.warn('Vercel KV get error:', err.message);
      }
    }

    // B. Try Vercel Edge Config
    if (process.env.EDGE_CONFIG) {
      try {
        const edgeStore = await getEdgeConfig('garage_store_data');
        if (edgeStore && edgeStore.config && edgeStore.menu) {
          return res.status(200).json(edgeStore);
        }
      } catch (err) {
        console.warn('Vercel Edge Config get error:', err.message);
      }
    }

    // C. Try Supabase Client
    if (supabase) {
      try {
        const { data: cfgData } = await supabase.from('garage_config').select('config_data').eq('id', 1).single();
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
        console.warn('Supabase fetch warning:', err.message);
      }
    }

    // D. Try Vercel Postgres (sql)
    if (sql) {
      try {
        const cfgRows = await sql`SELECT config_data FROM garage_config WHERE id = 1`;
        const menuRows = await sql`SELECT * FROM garage_menu ORDER BY created_at ASC`;

        if (cfgRows && cfgRows.length > 0 && menuRows && menuRows.length > 0) {
          const formattedMenu = menuRows.map(m => ({
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
            config: cfgRows[0].config_data,
            menu: formattedMenu
          });
        }
      } catch (err) {
        console.warn('Vercel Postgres fetch warning:', err.message);
      }
    }

    // E. Return Fallback JSON
    return res.status(200).json(getFallbackStore());
  }

  // POST: Save live store data to all available Vercel Storage providers
  if (req.method === 'POST') {
    try {
      const { pin, config, menu } = req.body || {};
      const fallback = getFallbackStore();

      const expectedPin = (config && config.adminPin) || fallback.config.adminPin || '1234';
      if (pin !== expectedPin) {
        return res.status(401).json({ error: 'PIN de seguridad incorrecto' });
      }

      // A. Save to Vercel KV if configured
      if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        try {
          await kv.set('garage_store_data', { config, menu });
        } catch (err) {
          console.warn('Vercel KV set error:', err.message);
        }
      }

      // B. Save to Supabase if configured
      if (supabase) {
        try {
          if (config) {
            await supabase.from('garage_config').upsert({
              id: 1,
              config_data: config,
              updated_at: new Date().toISOString()
            });
          }
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
        } catch (err) {
          console.warn('Supabase save error:', err.message);
        }
      }

      // C. Save to Vercel Postgres if configured
      if (sql) {
        try {
          if (config) {
            await sql`
              INSERT INTO garage_config (id, config_data, updated_at)
              VALUES (1, ${JSON.stringify(config)}, NOW())
              ON CONFLICT (id) DO UPDATE SET config_data = ${JSON.stringify(config)}, updated_at = NOW()
            `;
          }
          if (menu && menu.length > 0) {
            for (const m of menu) {
              await sql`
                INSERT INTO garage_menu (id, name, category, price, description, image, badge, available, is_favorite)
                VALUES (${m.id}, ${m.name}, ${m.category}, ${m.price}, ${m.description}, ${m.image}, ${m.badge || ''}, ${m.available !== false}, ${m.isFavorite === true})
                ON CONFLICT (id) DO UPDATE SET
                  name = EXCLUDED.name,
                  category = EXCLUDED.category,
                  price = EXCLUDED.price,
                  description = EXCLUDED.description,
                  image = EXCLUDED.image,
                  badge = EXCLUDED.badge,
                  available = EXCLUDED.available,
                  is_favorite = EXCLUDED.is_favorite
              `;
            }
          }
        } catch (err) {
          console.warn('Vercel Postgres save error:', err.message);
        }
      }

      // Update in-memory fallback
      if (config) fallback.config = config;
      if (menu) fallback.menu = menu;
      storeMemory = fallback;

      return res.status(200).json({
        success: true,
        message: '¡Ajustes guardados exitosamente en Vercel Storage!',
        data: fallback
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error guardando en Vercel Storage: ' + error.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
