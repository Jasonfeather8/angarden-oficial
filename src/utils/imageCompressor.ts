/**
 * Utilitário para comprimir e redimensionar imagens (File ou DataURL)
 * Evita estourar o limite de cota do localStorage (normalmente ~5MB total).
 */
export async function compressImage(
  source: File | string,
  maxWidth = 600,
  maxHeight = 600,
  quality = 0.82
): Promise<string> {
  // Se for uma URL externa (http/https), mantém como está
  if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
    return source;
  }

  return new Promise((resolve) => {
    const processDataUrl = (dataUrl: string) => {
      // Se não for um data URL de imagem, retorna original
      if (!dataUrl.startsWith('data:image')) {
        return resolve(dataUrl);
      }

      // Se for SVG, não redimensiona por canvas
      if (dataUrl.startsWith('data:image/svg')) {
        return resolve(dataUrl);
      }

      // Se já for muito pequeno (< 50KB), não precisa recomprimir
      if (dataUrl.length < 50000) {
        return resolve(dataUrl);
      }

      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(dataUrl);
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Exporta como JPEG para compressão eficiente
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    };

    if (typeof source === 'string') {
      processDataUrl(source);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          processDataUrl(result);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(source);
    }
  });
}
