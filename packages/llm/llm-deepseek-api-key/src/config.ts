/** API-key configuration resolved together with one Messages endpoint generation and its model listing. */
import type { Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { credentialRef, type CredentialRef } from '@deepseek-ai/dsh-credentials'
import type { LaunchEnvironmentSnapshot } from '@deepseek-ai/dsh-launch-environment'
import {
  deepSeekConfigFields, isBuiltInCatalog, modelListingConfigFields, modelListingURL, plainOptions as protocolOptions, PUBLIC_BASE_URL,
  resolveAdapterOptions as resolveProtocolOptions, resolveListingTiming,
} from '@deepseek-ai/dsh-llm-deepseek'
import type {
  Config as ProtocolConfig, DeepSeekConnectionOptions, ListingSettings, ModelListingConfig, ModelListingOptions, Options as ProtocolOptions,
} from '@deepseek-ai/dsh-llm-deepseek'

/** Origin whose listing is followed by default without a downstream opt-in. */
const OFFICIAL_ORIGIN = new URL(PUBLIC_BASE_URL).origin

/** Messages configuration with a per-request API-key reference. */
export interface Config extends ProtocolConfig, ModelListingConfig {
  /** Credential reference resolved per request; defaults to DEEPSEEK_API_KEY. */
  apiKeyEnv: Volatile<string>
  /** Opt into the same-origin listing on a relay; unavailable or stale listings offer no models. */
  followModelListing: Volatile<boolean>
}
export const Config = z.object({
  ...deepSeekConfigFields,
  ...modelListingConfigFields,
  apiKeyEnv: z.string().role('credential-ref').default('DEEPSEEK_API_KEY').volatile(),
  followModelListing: z.boolean().default(false).volatile(),
})
/** Plain deployment inputs for the API-key provider. */
export type Options = ProtocolOptions & ModelListingOptions & { apiKeyEnv?: string; followModelListing?: boolean }
/** Endpoint and credential reference captured from the same configuration generation. */
export interface ResolvedDeepSeekOptions extends DeepSeekConnectionOptions {
  /** Credential reference used only for this connection snapshot. */
  apiKeyEnv: CredentialRef
  /** Whether the authenticated listing is the required, fail-closed catalog authority. */
  followModelListing: boolean
  /**
   * The same-origin `/models` listing this generation follows. Relay following requires an explicit opt-in.
   */
  listing?: ListingSettings
}
/** Read one validated provider configuration.
 * @param config - live plugin configuration.
 * @returns detached resolver inputs.
 */
export function plainOptions(config: Config): Options {
  return { ...protocolOptions(config), apiKeyEnv: config.apiKeyEnv.get(), followModelListing: config.followModelListing.get() }
}
/** Resolve API-key, listing, and protocol settings together.
 * @param config - raw deployment settings.
 * @param environment - application launch environment.
 * @returns validated endpoint facts, the matching credential reference, and the listing the catalog follows.
 */
export function resolveAdapterOptions(config: Options, environment?: LaunchEnvironmentSnapshot): ResolvedDeepSeekOptions {
  const { modelsTimeoutMs: _timeout, modelsMaxAgeMs: _maxAge, apiKeyEnv, followModelListing = false, ...messages } = config
  if (typeof followModelListing !== 'boolean') throw new Error('llm-deepseek-api-key: followModelListing must be a boolean')
  const timing = resolveListingTiming(config, 'llm-deepseek-api-key')
  const connection = resolveProtocolOptions(messages, environment)
  const builtIn = isBuiltInCatalog(connection.models)
  if (followModelListing && !builtIn) throw new Error('llm-deepseek-api-key: followModelListing requires the built-in catalog')
  const listed = (followModelListing || new URL(connection.baseURL).origin === OFFICIAL_ORIGIN) && builtIn
  return {
    ...connection,
    apiKeyEnv: credentialRef(apiKeyEnv ?? 'DEEPSEEK_API_KEY'),
    followModelListing,
    ...listed ? {
      listing: { url: modelListingURL(connection.baseURL), ...timing, ...followModelListing ? { failClosed: true } : {} },
    } : {},
  }
}
