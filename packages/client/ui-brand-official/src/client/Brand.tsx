import { BrandWordmark, FishLogo } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'
import css from './Brand.module.css'

/**
 * Render the official mark with the presentation requested by its host surface.
 * @param props - Host-supplied mark presentation.
 * @returns the official whale mark.
 */
export function OfficialBrandMark({ size }: SidebarBrandMarkOwnerProps) {
  const logo = process.env.DSH_CLIENT_BRAND_LOGO_URL
  if (process.env.DSH_CLIENT_BRAND_NAME) {
    return logo ? <img src={logo} width={size} height={size} alt="" className={css.mark} /> : null
  }
  return <FishLogo size={size} />
}

/**
 * Render the official name artwork without its independently slotted mark.
 * @returns the official name wordmark.
 */
export function OfficialBrandName() {
  const name = process.env.DSH_CLIENT_BRAND_NAME
  const tagline = process.env.DSH_CLIENT_BRAND_TAGLINE
  if (name) {
    return <span className={css.identity}>
      <span className={css.name}>{name}</span>
      {tagline && <span className={css.tagline}>{tagline}</span>}
    </span>
  }
  return <BrandWordmark includeMark={false} />
}
