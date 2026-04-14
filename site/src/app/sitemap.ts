// Sitemap for fit-flush.com — single root URL.

import type { MetadataRoute } from 'next'

/** Static sitemap with the canonical root URL. */
export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: 'https://fit-flush.com',
			lastModified: new Date(),
			changeFrequency: 'monthly',
			priority: 1,
		},
	]
}
