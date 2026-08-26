/** Thrown by the campaign libs on a caller-visible input error; routes map
 *  `status`/`code` onto a clean HTTP response. */
export class CampaignError extends Error {
  readonly code: string
  readonly status: number
  constructor(message: string, opts: { code?: string; status?: number } = {}) {
    super(message)
    this.name = 'CampaignError'
    this.code = opts.code ?? 'campaign_error'
    this.status = opts.status ?? 400
  }
}
