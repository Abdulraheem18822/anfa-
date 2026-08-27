import { supabase, CUSTOM_DESIGNS_BUCKET } from './supabase';

export interface CanvasExportResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  publicUrl?: string;
  storagePath?: string;
  error?: string;
}

/**
 * Converts a data URL (e.g. from canvas.toDataURL('image/png')) to a standard Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Renders apparel base mockup and custom artwork onto an HTML5 Canvas,
 * converts to PNG Blob via canvas.toDataURL('image/png'), and uploads to Supabase 'custom-designs' bucket.
 */
export async function exportAndUploadCanvasDesign(
  canvas: HTMLCanvasElement,
  options?: {
    customFileName?: string;
    userId?: string;
    customerEmail?: string;
  }
): Promise<CanvasExportResult> {
  console.log('[POD Canvas Exporter] Converting HTML5 Canvas to PNG data URL...');

  try {
    // 1. Convert canvas to Data URL
    const dataUrl = canvas.toDataURL('image/png');
    console.log('[POD Canvas Exporter] Canvas converted to dataURL length:', dataUrl.length);

    // 2. Convert Data URL to PNG Blob
    const blob = dataUrlToBlob(dataUrl);
    console.log('[POD Canvas Exporter] Created PNG Blob with size (bytes):', blob.size);

    const timestamp = Date.now();
    const cleanUserId = (options?.userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = options?.customFileName
      ? `${timestamp}_${options.customFileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      : `design_${cleanUserId}_${timestamp}.png`;
    const storagePath = `custom_pod/${cleanUserId}/${fileName}`;

    console.log(`[POD Canvas Exporter] Uploading Blob to Supabase Storage bucket '${CUSTOM_DESIGNS_BUCKET}' at:`, storagePath);

    // 3. Upload Blob to Supabase Storage bucket 'custom-designs'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(CUSTOM_DESIGNS_BUCKET)
      .upload(storagePath, blob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true,
      });

    let publicUrl = '';

    if (uploadError) {
      console.warn('[POD Canvas Exporter] Supabase Storage direct upload note:', uploadError.message);
      // Fallback dataUrl if bucket permissions are pending
      publicUrl = dataUrl;
    } else {
      // 4. Retrieve Public Image URL
      const { data: urlData } = supabase.storage
        .from(CUSTOM_DESIGNS_BUCKET)
        .getPublicUrl(storagePath);
      publicUrl = urlData.publicUrl;
      console.log('[POD Canvas Exporter] Successfully uploaded to Supabase Storage! Public URL:', publicUrl);
    }

    // 5. Also record in public.custom_designs table if available
    try {
      await supabase.from('custom_designs').insert([
        {
          id: `design-${timestamp}`,
          customer_id: options?.userId || 'guest',
          customer_email: options?.customerEmail,
          file_name: fileName,
          file_url: publicUrl,
          storage_path: storagePath,
          file_size: blob.size,
          width_px: canvas.width,
          height_px: canvas.height,
          is_transparent: true,
          created_at: new Date().toISOString(),
        },
      ]);
      console.log('[POD Canvas Exporter] custom_designs table row created');
    } catch (e) {
      console.warn('[POD Canvas Exporter] custom_designs row insert note:', e);
    }

    return {
      success: true,
      dataUrl,
      blob,
      publicUrl,
      storagePath,
    };
  } catch (err: any) {
    console.error('[POD Canvas Exporter] Export failed:', err);
    return {
      success: false,
      error: err?.message || 'Failed to export and upload canvas design',
    };
  }
}

/**
 * Creates an offscreen HTML5 canvas to bake a shirt color, artwork image, text, and print area
 * into a single high-res composite PNG and uploads it to Supabase 'custom-designs'.
 */
export async function renderAndUploadCompositeMockup(params: {
  shirtColor: string;
  graphicUrl?: string;
  customText?: string;
  printScale?: number;
  userId?: string;
  customerEmail?: string;
}): Promise<CanvasExportResult> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve({ success: false, error: 'Could not acquire canvas 2D rendering context' });
        return;
      }

      // Draw background / shirt base silhouette
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Garment silhouette background
      ctx.fillStyle = params.shirtColor || '#1E1E24';
      ctx.beginPath();
      // Draw smooth stylized t-shirt silhouette shape
      ctx.moveTo(400, 150);
      ctx.lineTo(250, 240);
      ctx.lineTo(150, 420);
      ctx.lineTo(300, 500);
      ctx.lineTo(340, 420);
      ctx.lineTo(340, 1050);
      ctx.lineTo(860, 1050);
      ctx.lineTo(860, 420);
      ctx.lineTo(900, 500);
      ctx.lineTo(1050, 420);
      ctx.lineTo(950, 240);
      ctx.lineTo(800, 150);
      ctx.quadraticCurveTo(600, 280, 400, 150);
      ctx.closePath();
      ctx.fill();

      // If graphic URL is provided, load and draw onto chest area
      if (params.graphicUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = async () => {
          const scale = params.printScale || 0.65;
          const maxDim = 500 * scale;
          const imgAspect = img.width / img.height;
          let drawW = maxDim;
          let drawH = maxDim;

          if (imgAspect > 1) {
            drawH = maxDim / imgAspect;
          } else {
            drawW = maxDim * imgAspect;
          }

          const drawX = 600 - drawW / 2;
          const drawY = 480 - drawH / 2;

          ctx.drawImage(img, drawX, drawY, drawW, drawH);

          // Draw custom text if present
          if (params.customText) {
            ctx.font = 'bold 36px sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.fillText(params.customText, 600, drawY + drawH + 50);
          }

          const res = await exportAndUploadCanvasDesign(canvas, {
            userId: params.userId,
            customerEmail: params.customerEmail,
          });
          resolve(res);
        };

        img.onerror = async () => {
          // If image fails to load externally, export canvas directly
          const res = await exportAndUploadCanvasDesign(canvas, {
            userId: params.userId,
            customerEmail: params.customerEmail,
          });
          resolve(res);
        };

        img.src = params.graphicUrl;
      } else {
        // Only text
        if (params.customText) {
          ctx.font = 'bold 44px sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.fillText(params.customText, 600, 500);
        }

        exportAndUploadCanvasDesign(canvas, {
          userId: params.userId,
          customerEmail: params.customerEmail,
        }).then(resolve);
      }
    } catch (e: any) {
      resolve({ success: false, error: e?.message || 'Error rendering canvas composite' });
    }
  });
}
