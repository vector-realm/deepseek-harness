/** Build native artwork from the same public logo data URL used by the browser. */
import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

/** Render the downstream public SVG locally; never fetch a build-time URL. */
export async function writeDesktopBrandAsset(directory: string, logo: string | undefined): Promise<void> {
  const output = join(directory, 'lib', 'brand.png')
  if (!logo) { await rm(output, { force: true }); return }
  const prefix = 'data:image/svg+xml;base64,'
  if (!logo.startsWith(prefix)) throw new Error('desktop brand: logo must be a public base64 SVG data URL')
  await mkdir(join(directory, 'lib'), { recursive: true })
  await sharp(Buffer.from(logo.slice(prefix.length), 'base64')).resize(1024, 1024, { fit: 'contain' }).png().toFile(output)
}
