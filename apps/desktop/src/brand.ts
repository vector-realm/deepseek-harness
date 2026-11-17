/** Public downstream identity shared by the desktop shell and development carrier. */
export interface DesktopBrand {
  /** Display name supplied by the downstream single brand configuration. */
  readonly name: string | undefined
  /** OS URL scheme; unrelated to the private dsh-app document scheme. */
  readonly protocol: string
  /** Application identity for a downstream carrier. */
  readonly appId: string | undefined
}

/** Resolve public identity without reading deployment credentials or business configuration. */
export function desktopBrand(): DesktopBrand {
  const protocol = process.env.DSH_CLIENT_BRAND_PROTOCOL || 'dsh'
  const appId = process.env.DSH_CLIENT_BRAND_APP_ID || undefined
  if (!/^[a-z][a-z0-9+.-]*$/.test(protocol)) throw new Error('desktop brand: invalid URL protocol')
  if (appId !== undefined && !/^[A-Za-z][A-Za-z0-9.-]*$/.test(appId)) throw new Error('desktop brand: invalid application id')
  return { name: process.env.DSH_CLIENT_BRAND_NAME || undefined, protocol, appId }
}
