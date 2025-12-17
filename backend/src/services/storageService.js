const supabase = require('../config/supabase');

/**
 * Sube un archivo a un bucket de Supabase
 * @param {Object} file - Objeto file de Multer
 * @param {String} folder - Carpeta destino (ej: 'documentos', 'evidencias')
 * @returns {String} URL pública del archivo
 */
const uploadFile = async (file, folder) => {
  try {
    // 1. Crear nombre único: timestamp_nombreOriginal
    // Limpiamos el nombre de espacios y caracteres raros
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${folder}/${Date.now()}_${cleanName}`;

    // 2. Subir a Supabase Storage
    // Asegúrate de haber creado un bucket llamado 'parkify-files' en tu dashboard de Supabase
    // y que sea PÚBLICO (Public Bucket).
    const { data, error } = await supabase
      .storage
      .from('parkify-files') // <--- NOMBRE DE TU BUCKET
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) throw error;

    // 3. Obtener URL pública
    const { data: publicData } = supabase
      .storage
      .from('parkify-files')
      .getPublicUrl(fileName);

    return publicData.publicUrl;

  } catch (error) {
    console.error('Error subiendo archivo:', error.message);
    throw new Error('No se pudo subir la imagen al servidor.');
  }
};

/**
 * Sube un Buffer (archivo generado en memoria) a Supabase
 * @param {Buffer} buffer - Datos del archivo
 * @param {String} fileName - Nombre completo con ruta (ej: 'qr/codigo.png')
 * @param {String} mimeType - Tipo de archivo (ej: 'image/png', 'application/pdf')
 * @returns {String} URL pública
 */
const uploadBuffer = async (buffer, fileName, mimeType) => {
  try {
    const { data, error } = await supabase
      .storage
      .from('parkify-files')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) throw error;

    const { data: publicData } = supabase
      .storage
      .from('parkify-files')
      .getPublicUrl(fileName);

    return publicData.publicUrl;
  } catch (error) {
    console.error('Error subiendo buffer:', error.message);
    throw new Error('Error al guardar archivo generado.');
  }
};

// Asegúrate de exportar ambas funciones
module.exports = { uploadFile, uploadBuffer };
