/**
 * NASA Image and Video Library API integration.
 * Connects to NASA's public API (https://images-api.nasa.gov) for live image retrieval
 * while providing verified offline image metadata as a dependable baseline.
 * Does not require or expose any private API keys.
 */

export interface NasaOfficialImage {
  nasaId: string;
  title: string;
  dateCreated: string;
  center: string;
  credit: string;
  description: string;
  imageUrl: string;
  thumbUrl: string;
  sourceUrl: string;
  catalogSource: 'NASA Image and Video Library' | 'JPL Photojournal' | 'NASA Planetary Data System';
  isLocal?: boolean;
  localFilename?: string;
  remoteUrl?: string;
}

/**
 * Resolves a public asset path taking into account Vite's BASE_URL (supporting subpath deployments).
 */
export function getLocalAssetUrl(relativePath: string): string {
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  const baseUrl =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
      ? import.meta.env.BASE_URL
      : '/';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Searches the official NASA Image and Video Library public endpoint.
 * Includes graceful timeout, error recovery, and payload normalization.
 */
export async function searchLiveNasaImages(
  query: string,
  timeoutMs: number = 8000
): Promise<NasaOfficialImage[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const encoded = encodeURIComponent(query.trim());
    const endpoint = `https://images-api.nasa.gov/search?q=${encoded}&media_type=image`;

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`NASA API returned HTTP status ${response.status}`);
    }

    const json = await response.json();
    const items = json?.collection?.items || [];

    const results: NasaOfficialImage[] = [];

    for (const item of items) {
      const data = item.data?.[0];
      if (!data || !data.nasa_id) continue;

      // Extract image link
      const links = item.links || [];
      const imageLink =
        links.find((l: any) => l.rel === 'alternate' || l.render === 'image')?.href ||
        links.find((l: any) => l.rel === 'preview')?.href ||
        `https://images-assets.nasa.gov/image/${data.nasa_id}/${data.nasa_id}~medium.jpg`;

      const thumbLink =
        links.find((l: any) => l.rel === 'preview')?.href ||
        `https://images-assets.nasa.gov/image/${data.nasa_id}/${data.nasa_id}~thumb.jpg`;

      results.push({
        nasaId: data.nasa_id,
        title: data.title || data.nasa_id,
        dateCreated: data.date_created ? data.date_created.slice(0, 10) : 'Date Unknown',
        center: data.center || 'NASA / JPL',
        credit: data.secondary_creator || data.center || 'NASA / JPL-Caltech',
        description: data.description || 'Official NASA Planetary Image Archive asset.',
        imageUrl: imageLink,
        thumbUrl: thumbLink,
        sourceUrl: `https://images.nasa.gov/details/${data.nasa_id}`,
        catalogSource: 'NASA Image and Video Library',
      });

      if (results.length >= 10) break;
    }

    return results;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('NASA live image query timed out after', timeoutMs, 'ms');
    } else {
      console.warn('NASA live image query failed:', err.message);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
