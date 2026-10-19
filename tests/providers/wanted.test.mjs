// tests/providers/wanted.test.mjs — tests for Wanted provider (wanted.co.kr).
import { pass, fail, ROOT } from '../helpers.mjs';
import { join } from 'path';
import { pathToFileURL } from 'url';

console.log('\nProvider — wanted');

try {
  const wantedModule = await import(pathToFileURL(join(ROOT, 'providers/wanted.mjs')).href);
  const wanted = wantedModule.default;
  const {
    assertWantedUrl,
    resolveMaxPages,
    resolveWantedUrl,
    formatWantedLocation,
    normalizeWantedJob,
  } = wantedModule;

  // 1. Provider id
  if (wanted.id === 'wanted') pass('wanted.id is "wanted"');
  else fail(`wanted.id is ${JSON.stringify(wanted.id)}`);

  // 2. assertWantedUrl
  try {
    assertWantedUrl('https://www.wanted.co.kr/wdlist/518');
    assertWantedUrl('https://wanted.co.kr/company/123');
    pass('assertWantedUrl accepts trusted https URLs');
  } catch (err) {
    fail(`assertWantedUrl threw on valid URL: ${err.message}`);
  }

  try {
    assertWantedUrl('http://www.wanted.co.kr/wdlist/518');
    fail('assertWantedUrl should reject http:');
  } catch {
    pass('assertWantedUrl rejects non-https');
  }

  try {
    assertWantedUrl('https://evil.wanted.co.kr.attacker.com/jobs');
    fail('assertWantedUrl should reject untrusted host');
  } catch {
    pass('assertWantedUrl rejects untrusted host');
  }

  // 3. resolveWantedUrl
  const companyEntry = resolveWantedUrl({
    careers_url: 'https://www.wanted.co.kr/company/63',
  });
  if (
    companyEntry.type === 'company' &&
    companyEntry.url === 'https://www.wanted.co.kr/api/chaos/companies/v1/63/jobs'
  ) {
    pass('resolveWantedUrl maps /company/{id} to company jobs API');
  } else {
    fail(`resolveWantedUrl company mapping failed: ${JSON.stringify(companyEntry)}`);
  }

  const wdlistEntry = resolveWantedUrl({
    careers_url: 'https://www.wanted.co.kr/wdlist/518/872?years=3',
  });
  if (
    wdlistEntry.type === 'navigation' &&
    wdlistEntry.url.includes('job_group_id=518') &&
    wdlistEntry.url.includes('tag_type_ids=872') &&
    wdlistEntry.url.includes('years=3')
  ) {
    pass('resolveWantedUrl maps /wdlist/{group}/{tag} with params');
  } else {
    fail(`resolveWantedUrl wdlist mapping failed: ${JSON.stringify(wdlistEntry)}`);
  }

  const defaultEntry = resolveWantedUrl({});
  if (defaultEntry.type === 'navigation' && defaultEntry.url.includes('job_group_id=518')) {
    pass('resolveWantedUrl falls back to default 518 navigation');
  } else {
    fail(`resolveWantedUrl fallback failed: ${JSON.stringify(defaultEntry)}`);
  }

  // 4. formatWantedLocation
  const loc1 = formatWantedLocation({ country: '한국', location: '서울', district: '강남구' });
  if (loc1 === '서울 강남구') pass('formatWantedLocation formats Korean district');
  else fail(`formatWantedLocation = ${JSON.stringify(loc1)}`);

  const loc2 = formatWantedLocation({ country: '일본', location: '도쿄' });
  if (loc2 === '일본 도쿄') pass('formatWantedLocation preserves non-Korean country');
  else fail(`formatWantedLocation = ${JSON.stringify(loc2)}`);

  // 5. normalizeWantedJob
  const sampleNavJob = {
    id: 12345,
    position: '시니어 백엔드 엔지니어',
    company: { name: '테스트 컴퍼니' },
    address: { country: '한국', location: '서울', district: '서초구' },
  };
  const normalizedNav = normalizeWantedJob(sampleNavJob);
  if (
    normalizedNav &&
    normalizedNav.title === '시니어 백엔드 엔지니어' &&
    normalizedNav.company === '테스트 컴퍼니' &&
    normalizedNav.location === '서울 서초구' &&
    normalizedNav.url === 'https://www.wanted.co.kr/wd/12345' &&
    normalizedNav.externalId === '12345'
  ) {
    pass('normalizeWantedJob maps navigation result correctly');
  } else {
    fail(`normalizeWantedJob failed: ${JSON.stringify(normalizedNav)}`);
  }

  const sampleCompJob = {
    id: 67890,
    name: 'Frontend Developer',
    address: { location: '경기', district: '판교' },
  };
  const normalizedComp = normalizeWantedJob(sampleCompJob, '카카오');
  if (
    normalizedComp &&
    normalizedComp.title === 'Frontend Developer' &&
    normalizedComp.company === '카카오' &&
    normalizedComp.location === '경기 판교' &&
    normalizedComp.url === 'https://www.wanted.co.kr/wd/67890' &&
    normalizedComp.externalId === '67890'
  ) {
    pass('normalizeWantedJob maps company job with fallbackCompany');
  } else {
    fail(`normalizeWantedJob company failed: ${JSON.stringify(normalizedComp)}`);
  }

  if (normalizeWantedJob(null) === null && normalizeWantedJob({ id: 1 }) === null) {
    pass('normalizeWantedJob drops empty or invalid jobs');
  } else {
    fail('normalizeWantedJob should return null for invalid inputs');
  }

  // 6. detect
  if (wanted.detect({ provider: 'wanted' })) {
    pass('detect() claims entry with provider: "wanted"');
  } else {
    fail('detect() failed on provider: "wanted"');
  }

  if (wanted.detect({ careers_url: 'https://www.wanted.co.kr/wdlist/518' })) {
    pass('detect() claims entry with wanted.co.kr careers_url');
  } else {
    fail('detect() failed on wanted.co.kr careers_url');
  }

  if (wanted.detect({ careers_url: 'https://boards.greenhouse.io/test' }) === null) {
    pass('detect() ignores non-wanted URLs');
  } else {
    fail('detect() falsely claimed non-wanted URL');
  }

  // 7. fetch (navigation mock)
  const mockCtx = {
    async fetchJson(url) {
      if (url.includes('offset=0')) {
        return {
          data: [
            { id: 101, position: 'Job 1', company: { name: 'Corp A' } },
            { id: 102, position: 'Job 2', company: { name: 'Corp B' } },
          ],
          links: { next: '/api/chaos/navigation/v1/results?limit=2&offset=2' },
        };
      }
      return {
        data: [{ id: 103, position: 'Job 3', company: { name: 'Corp C' } }],
        links: { next: null },
      };
    },
    maxPages: 5,
  };

  const navJobs = await wanted.fetch({ provider: 'wanted' }, mockCtx);
  if (navJobs.length === 3 && navJobs.map(j => j.externalId).join(',') === '101,102,103') {
    pass('wanted.fetch paginates navigation API and stops when next is null');
  } else {
    fail(`wanted.fetch navigation pagination failed: length=${navJobs.length}`);
  }

  // 8. fetch (company mock)
  const mockCompanyCtx = {
    async fetchJson(url) {
      return {
        jobs: [
          { id: 201, name: 'Dev 1', status: 'active' },
          { id: 202, name: 'Dev 2', status: 'inactive' },
          { id: 203, name: 'Dev 3', status: 'active' },
        ],
      };
    },
  };
  const compJobs = await wanted.fetch(
    { careers_url: 'https://www.wanted.co.kr/company/999', name: 'Corp 999' },
    mockCompanyCtx,
  );
  if (compJobs.length === 2 && compJobs.map(j => j.externalId).join(',') === '201,203') {
    pass('wanted.fetch filters active jobs from company endpoint');
  } else {
    fail(`wanted.fetch company failed: length=${compJobs.length}`);
  }
} catch (err) {
  fail(`Unexpected error in wanted.test.mjs: ${err.message}\n${err.stack}`);
}
