import fs from 'fs';
import path from 'path';

const images = [
  {
    nasaId: 'PIA07371',
    filename: 'spirit_pia07371_self_portrait.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA07371/PIA07371~medium.jpg',
  },
  {
    nasaId: 'PIA10128',
    filename: 'spirit_pia10128_husband_hill.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA10128/PIA10128~medium.jpg',
  },
  {
    nasaId: 'PIA18079',
    filename: 'opportunity_pia18079_self_portrait.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA18079/PIA18079~medium.jpg',
  },
  {
    nasaId: 'PIA05460',
    filename: 'opportunity_pia05460_empty_nest.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA05460/PIA05460~medium.jpg',
  },
  {
    nasaId: 'PIA10985',
    filename: 'phoenix_pia10985_surface_ice.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA10985/PIA10985~medium.jpg',
  },
  {
    nasaId: 'PIA10701',
    filename: 'phoenix_pia10701_lander_polar.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA10701/PIA10701~medium.jpg',
  },
  {
    nasaId: 'PIA22876',
    filename: 'insight_pia22876_first_selfie.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA22876/PIA22876~medium.jpg',
  },
  {
    nasaId: 'PIA22874',
    filename: 'insight_pia22874_workspace_mosaic.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA22874/PIA22874~medium.jpg',
  },
  {
    nasaId: 'PIA19808',
    filename: 'curiosity_pia19808_buckskin_selfie.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA19808/PIA19808~medium.jpg',
  },
  {
    nasaId: 'PIA16239',
    filename: 'curiosity_pia16239_rocknest_selfie.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA16239/PIA16239~medium.jpg',
  },
  {
    nasaId: 'PIA01122',
    filename: 'sojourner_pia01122_the_dice.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA01122/PIA01122~medium.jpg',
  },
  {
    nasaId: 'PIA01551',
    filename: 'sojourner_pia01551_surface_ramp.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA01551/PIA01551~medium.jpg',
  },
  {
    nasaId: 'PIA24542',
    filename: 'ingenuity_pia24542_perseverance_selfie.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA24542/PIA24542~medium.jpg',
  },
  {
    nasaId: 'PIA24647',
    filename: 'ingenuity_pia24647_flight5_takeoff.jpg',
    url: 'https://images-assets.nasa.gov/image/PIA24647/PIA24647~medium.jpg',
  },
];

const targetDir = path.resolve('public/images/nasa');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function downloadAll() {
  console.log(`Starting download of ${images.length} NASA images to ${targetDir}...`);
  const results = [];

  for (const img of images) {
    const destPath = path.join(targetDir, img.filename);
    try {
      console.log(`Downloading ${img.nasaId} from ${img.url}...`);
      const res = await fetch(img.url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());

      // Validate JPEG header (0xFF, 0xD8, 0xFF)
      if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
        throw new Error(`Downloaded buffer is not a valid JPEG! Header: ${buffer.slice(0, 4).toString('hex')}`);
      }

      fs.writeFileSync(destPath, buffer);
      const stats = fs.statSync(destPath);
      console.log(`[SUCCESS] Saved ${img.filename} (${(stats.size / 1024).toFixed(1)} KB)`);
      results.push({
        nasaId: img.nasaId,
        filename: img.filename,
        size: stats.size,
        sizeKb: (stats.size / 1024).toFixed(1),
        status: 'OK',
        url: img.url,
      });
    } catch (err) {
      console.error(`[ERROR] Failed to download ${img.nasaId}:`, err.message);
      results.push({
        nasaId: img.nasaId,
        filename: img.filename,
        status: 'FAILED',
        error: err.message,
        url: img.url,
      });
    }
  }

  console.log('\n--- DOWNLOAD SUMMARY ---');
  console.table(results);
}

downloadAll();
