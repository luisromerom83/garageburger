const fs = require('fs');
const path = require('path');

// In-memory / Vercel KV fallback storage handler
let storeMemory = null;

function getInitialStore() {
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
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const currentStore = getInitialStore();

  // GET: Fetch live store data
  if (req.method === 'GET') {
    return res.status(200).json(currentStore);
  }

  // POST: Update live store data
  if (req.method === 'POST') {
    try {
      const { pin, config, menu } = req.body || {};

      const expectedPin = currentStore.config.adminPin || '1234';
      if (pin !== expectedPin) {
        return res.status(401).json({ error: 'PIN de seguridad incorrecto' });
      }

      if (config) currentStore.config = config;
      if (menu) currentStore.menu = menu;

      storeMemory = currentStore;

      return res.status(200).json({ success: true, message: '¡Ajustes guardados con éxito en Vercel Storage!', data: currentStore });
    } catch (error) {
      return res.status(500).json({ error: 'Error interno guardando configuración: ' + error.message });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
