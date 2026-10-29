import { describe, expect, it } from 'vitest';
import { resolveBasePath } from './base-path.ts';

describe('base per hosting statico', () => {
  it.each([
    [{}, '/'],
    [{ REPOSITORY_NAME: 'nurseflow' }, '/nurseflow/'],
    [{ REPOSITORY_NAME: 'renamed-repository' }, '/renamed-repository/'],
    [{ REPOSITORY_NAME: 'nurseflow', VITE_BASE_PATH: '' }, '/nurseflow/'],
    [{ REPOSITORY_NAME: 'example.github.io' }, '/'],
    [{ REPOSITORY_NAME: 'nurseflow', VITE_BASE_PATH: '/' }, '/'],
    [{ VITE_BASE_PATH: '/custom/path/' }, '/custom/path/'],
    [{ VITE_BASE_PATH: 'nurseflow' }, '/nurseflow/'],
  ] as const)('normalizza %j in %s', (environment, expected) => {
    expect(resolveBasePath(environment)).toBe(expected);
  });

  it.each(['https://example.org/app/', '/../', '/app/../other/', '/app?x=1/'])('rifiuta %s', (value) => {
    expect(() => resolveBasePath({ VITE_BASE_PATH: value })).toThrow();
  });

  it('richiede il solo nome repository', () => {
    expect(() => resolveBasePath({ REPOSITORY_NAME: 'owner/repository' })).toThrow();
  });
});
