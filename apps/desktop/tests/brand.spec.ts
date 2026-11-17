/** Downstream desktop identity is public, optional, and derived from the browser logo. */
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterEach, expect, it, vi } from 'vitest'
import { desktopBrand } from '../src/brand.ts'
import { resolveDesktopLocale } from '../src/locale.ts'
import { writeDesktopBrandAsset } from '../scripts/desktop-brand-assets.ts'

afterEach(() => { vi.unstubAllEnvs() })

it('preserves upstream identity unless public brand values are supplied', () => {
  vi.stubEnv('DSH_CLIENT_BRAND_NAME', undefined)
  vi.stubEnv('DSH_CLIENT_BRAND_PROTOCOL', undefined)
  vi.stubEnv('DSH_CLIENT_BRAND_APP_ID', undefined)
  expect(desktopBrand()).toEqual({ name: undefined, protocol: 'dsh', appId: undefined })
  expect(resolveDesktopLocale('en').messages.aboutProduct).toBe('DeepSeek Harness')
  vi.stubEnv('DSH_CLIENT_BRAND_NAME', 'Fixture Restaurant')
  vi.stubEnv('DSH_CLIENT_BRAND_PROTOCOL', 'fixture-restaurant')
  vi.stubEnv('DSH_CLIENT_BRAND_APP_ID', 'example.fixture.restaurant')
  expect(desktopBrand()).toEqual({ name: 'Fixture Restaurant', protocol: 'fixture-restaurant', appId: 'example.fixture.restaurant' })
  for (const locale of ['en', 'zh', 'ja', 'de', 'fr', 'es', 'pt', 'ru']) {
    const messages = resolveDesktopLocale(locale).messages
    expect(messages.aboutProduct).toBe('Fixture Restaurant')
    expect(messages.aboutMenu).toContain('Fixture Restaurant')
    expect(messages.welcomeBrand).toBe('Fixture Restaurant')
  }
})

it.each(['HTTPS://bad', '../dsh', 'dsh://'])('rejects malformed URL scheme %s', (value) => {
  vi.stubEnv('DSH_CLIENT_BRAND_PROTOCOL', value)
  expect(desktopBrand).toThrow('invalid URL protocol')
})

it('rejects malformed application identity', () => {
  vi.stubEnv('DSH_CLIENT_BRAND_APP_ID', '../other-app')
  expect(desktopBrand).toThrow('invalid application id')
})

it('derives a native PNG locally from the same SVG and removes stale custom artwork', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-brand-'))
  try {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#123F38"/></svg>'
    await writeDesktopBrandAsset(root, `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`)
    const path = join(root, 'lib', 'brand.png')
    expect(await sharp(path).metadata()).toMatchObject({ format: 'png', width: 1024, height: 1024 })
    const actualPixels = await sharp(path).raw().toBuffer()
    const expectedPixels = await sharp(Buffer.from(svg)).resize(1024, 1024).raw().toBuffer()
    expect(actualPixels.equals(expectedPixels)).toBe(true)
    await writeDesktopBrandAsset(root, undefined)
    await expect(readFile(path)).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(writeDesktopBrandAsset(root, 'https://unexpected.example/logo.svg')).rejects.toThrow('base64 SVG data URL')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
