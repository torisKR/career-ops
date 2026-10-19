// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */
/** @typedef {import('./_types.js').PortalEntry} PortalEntry */
/** @typedef {import('./_types.js').Job} Job */

// Wanted provider — wanted.co.kr, South Korea's premier tech recruiting platform.
// Supports both category/job-group discovery (e.g. 개발 직군) and tracked company
// career pages.
//
// Endpoints used (public, no authentication required):
//   1. Navigation / Board search:
//      https://www.wanted.co.kr/api/chaos/navigation/v1/results?job_group_id=518&country=kr&job_sort=job.latest_order&locations=all&years=-1&limit=100&offset=N
//   2. Company openings:
//      https://www.wanted.co.kr/api/chaos/companies/v1/{company_id}/jobs

import { coerceId } from './_ids.mjs';
import { sleep } from './_http.mjs';

const SITE_ORIGIN = 'https://www.wanted.co.kr';
const TRUSTED_HOSTS = new Set(['wanted.co.kr', 'www.wanted.co.kr']);
const DEFAULT_JOB_GROUP_ID = '518'; // 개발 (Development)
const DEFAULT_LIMIT = 100;
const DEFAULT_MAX_PAGES = 50;
const MAX_PAGES_CAP = 200;
const PAGE_DELAY_MS = 200;

/** @param {string} url */
export function assertWantedUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`wanted: invalid URL: ${url}`);
  }
  if (parsed.protocol !== 'https:') throw new Error(`wanted: URL must use HTTPS: ${url}`);
  if (!TRUSTED_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `wanted: untrusted hostname "${parsed.hostname}" — must be one of: ${[...TRUSTED_HOSTS].join(', ')}`,
    );
  }
  return url;
}

/**
 * Resolve the page cap: a positive integer `max_pages` on the entry, capped.
 * @param {any} entry
 */
export function resolveMaxPages(entry) {
  const v = entry?.max_pages;
  if (Number.isInteger(v) && v > 0) return Math.min(v, MAX_PAGES_CAP);
  return DEFAULT_MAX_PAGES;
}

/**
 * Resolve whether an entry points to a single company's Wanted page or a board list.
 *
 * @param {PortalEntry} entry
 * @returns {{ type: 'company' | 'navigation', url: string }}
 */
export function resolveWantedUrl(entry) {
  const raw = (entry.api || entry.careers_url || '').trim();

  if (raw) {
    try {
      const parsed = new URL(assertWantedUrl(raw));

      // Company jobs API: /api/chaos/companies/v1/{id}/jobs
      const apiCompanyMatch = parsed.pathname.match(/\/api\/chaos\/companies\/v1\/(\d+)\/jobs/);
      if (apiCompanyMatch) {
        return { type: 'company', url: parsed.href };
      }

      // Company webpage: /company/{id}
      const webCompanyMatch = parsed.pathname.match(/\/company\/(\d+)/);
      if (webCompanyMatch) {
        return {
          type: 'company',
          url: `${SITE_ORIGIN}/api/chaos/companies/v1/${webCompanyMatch[1]}/jobs`,
        };
      }

      // Direct navigation API: /api/chaos/navigation/v1/results
      if (parsed.pathname.includes('/api/chaos/navigation/v1/results')) {
        return { type: 'navigation', url: parsed.href };
      }

      // Web job board: /wdlist/{job_group_id}(/{tag_type_id})?
      const wdlistMatch = parsed.pathname.match(/\/wdlist(?:\/([^/?#]+))?(?:\/([^/?#]+))?/);
      if (wdlistMatch) {
        const jobGroupId = wdlistMatch[1] || DEFAULT_JOB_GROUP_ID;
        const tagTypeId = wdlistMatch[2];
        const apiUrl = new URL('/api/chaos/navigation/v1/results', SITE_ORIGIN);
        apiUrl.searchParams.set('job_group_id', jobGroupId);
        if (tagTypeId) {
          apiUrl.searchParams.set('tag_type_ids', tagTypeId);
        }
        apiUrl.searchParams.set('country', parsed.searchParams.get('country') || 'kr');
        apiUrl.searchParams.set('job_sort', parsed.searchParams.get('job_sort') || 'job.latest_order');
        apiUrl.searchParams.set('locations', parsed.searchParams.get('locations') || 'all');
        apiUrl.searchParams.set('years', parsed.searchParams.get('years') || '-1');
        apiUrl.searchParams.set('limit', String(DEFAULT_LIMIT));
        apiUrl.searchParams.set('offset', '0');
        return { type: 'navigation', url: apiUrl.href };
      }
    } catch {
      // Fall through to default navigation
    }
  }

  // Default: 개발 직군 (518) latest navigation
  const defaultUrl = new URL('/api/chaos/navigation/v1/results', SITE_ORIGIN);
  defaultUrl.searchParams.set('job_group_id', DEFAULT_JOB_GROUP_ID);
  defaultUrl.searchParams.set('country', 'kr');
  defaultUrl.searchParams.set('job_sort', 'job.latest_order');
  defaultUrl.searchParams.set('locations', 'all');
  defaultUrl.searchParams.set('years', '-1');
  defaultUrl.searchParams.set('limit', String(DEFAULT_LIMIT));
  defaultUrl.searchParams.set('offset', '0');
  return { type: 'navigation', url: defaultUrl.href };
}

/**
 * Format Korean location from Wanted address object.
 *
 * @param {any} address
 * @returns {string}
 */
export function formatWantedLocation(address) {
  if (!address || typeof address !== 'object') return '';
  const parts = [];
  if (address.country && address.country !== '한국' && typeof address.country === 'string') {
    parts.push(address.country.trim());
  }
  if (address.location && typeof address.location === 'string') {
    parts.push(address.location.trim());
  }
  if (address.district && typeof address.district === 'string') {
    parts.push(address.district.trim());
  }
  const joined = parts.filter(Boolean).join(' ').trim();
  if (joined) return joined;
  if (typeof address.full_location === 'string') return address.full_location.trim();
  return '';
}

/**
 * Normalize a single Wanted job into the canonical Job shape.
 *
 * @param {any} j
 * @param {string} [fallbackCompany]
 * @returns {Job | null}
 */
export function normalizeWantedJob(j, fallbackCompany) {
  if (!j || typeof j !== 'object') return null;

  const rawId = j.id;
  const externalId = coerceId(rawId);
  if (!externalId) return null;

  const title = (typeof j.position === 'string' ? j.position : typeof j.name === 'string' ? j.name : '').trim();
  if (!title) return null;

  const url = `${SITE_ORIGIN}/wd/${externalId}`;
  const company = (typeof j.company?.name === 'string' ? j.company.name : fallbackCompany || 'Wanted').trim();
  const location = formatWantedLocation(j.address);

  /** @type {Job} */
  const out = {
    title,
    url,
    company: company || 'Wanted',
    location,
    externalId,
  };

  return out;
}

/** @type {Provider} */
export default {
  id: 'wanted',

  detect(entry) {
    if (entry.provider === 'wanted') {
      try {
        const resolved = resolveWantedUrl(entry);
        return { url: resolved.url };
      } catch {
        return null;
      }
    }

    const raw = (entry.api || entry.careers_url || '').trim();
    if (!raw) return null;

    try {
      const parsed = new URL(raw);
      if (parsed.protocol === 'https:' && TRUSTED_HOSTS.has(parsed.hostname)) {
        const resolved = resolveWantedUrl(entry);
        return { url: resolved.url };
      }
    } catch {
      return null;
    }

    return null;
  },

  async fetch(entry, ctx) {
    const resolved = resolveWantedUrl(entry);
    assertWantedUrl(resolved.url);

    const fallbackCompany = entry?.name;
    const out = [];

    if (resolved.type === 'company') {
      const json = await ctx.fetchJson(resolved.url, { redirect: 'error' });
      const jobs = json?.jobs;
      if (!Array.isArray(jobs)) {
        throw new Error(
          `wanted: unexpected company API response — expected { jobs: [...] }, got keys: [${json ? Object.keys(json).join(', ') : 'null'}]`,
        );
      }
      for (const j of jobs) {
        if (j.status && j.status !== 'active') continue;
        const normalized = normalizeWantedJob(j, fallbackCompany);
        if (normalized) out.push(normalized);
      }
      return out;
    }

    // Navigation pagination loop
    const maxPages = Math.min(resolveMaxPages(entry), ctx?.maxPages ?? Number.POSITIVE_INFINITY);
    let currentUrl = resolved.url;

    for (let page = 1; page <= maxPages; page++) {
      const json = await ctx.fetchJson(currentUrl, { redirect: 'error' });
      const items = json?.data;
      if (!Array.isArray(items)) {
        throw new Error(
          `wanted: unexpected navigation API response on page ${page} — expected { data: [...] }, got keys: [${json ? Object.keys(json).join(', ') : 'null'}]`,
        );
      }

      for (const j of items) {
        const normalized = normalizeWantedJob(j, fallbackCompany);
        if (normalized) out.push(normalized);
      }

      // Check next page
      const nextPath = json?.links?.next;
      if (!nextPath || items.length === 0) {
        break;
      }

      try {
        const nextUrl = new URL(nextPath, SITE_ORIGIN);
        assertWantedUrl(nextUrl.href);
        currentUrl = nextUrl.href;
      } catch {
        break;
      }

      if (page < maxPages) {
        await sleep(PAGE_DELAY_MS, ctx);
      }
    }

    return out;
  },
};
