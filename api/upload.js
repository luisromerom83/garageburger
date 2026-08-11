const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.POSTGRES_URL_NON_POOLING;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey && supabaseUrl.includes('supabase')) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { imageBase64, fileName, fileType } = req.body || {};

    if (!imageBase64) {
      return res.status(400).json({ error: 'No se envió la imagen' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const safeFileName = `upload_${Date.now()}_${(fileName || 'photo.png').replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const contentType = fileType || 'image/png';

    // 1. Try upload to Supabase Storage if configured
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('garage_assets')
          .upload(safeFileName, buffer, {
            contentType: contentType,
            upsert: true
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from('garage_assets')
            .getPublicUrl(safeFileName);

          return res.status(200).json({
            success: true,
            url: publicUrlData.publicUrl,
            message: 'Imagen subida con éxito a Supabase Storage'
          });
        }
      } catch (e) {
        console.warn('Supabase storage upload failed:', e.message);
      }
    }

    // 2. Fallback: Return Data URL if storage is not connected
    const dataUrl = `data:${contentType};base64,${cleanBase64}`;
    return res.status(200).json({
      success: true,
      url: dataUrl,
      message: 'Imagen procesada exitosamente'
    });
  } catch (err) {
    return res.status(500).json({ error: 'Error procesando la imagen: ' + err.message });
  }
};
