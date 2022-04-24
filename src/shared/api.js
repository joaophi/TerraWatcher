import axios from "axios"
import axiosRateLimit from "axios-rate-limit"
import axiosRetry, { isNetworkOrIdempotentRequestError } from "axios-retry"
import "dotenv/config"

export const LCD_URL = process.env["LCD_URL"] ?? "https://lcd.terra.dev"
export const FCD_URL = process.env["FCD_URL"] ?? "https://fcd.terra.dev"
export const SWP_URL = process.env["SWP_URL"] ?? "https://api.terraswap.io"
export const ASS_URL = process.env["ASS_URL"] ?? "https://assets.terra.money"

export const lcdClient = axios.create({ baseURL: LCD_URL })
export const fcdClient = axiosRateLimit(axios.create({ baseURL: FCD_URL }), { maxRequests: 1, perMilliseconds: 1500 })
export const swapClient = axiosRateLimit(axios.create({ baseURL: SWP_URL }), { maxRequests: 10, perMilliseconds: 1000 })
export const assetsClient = axios.create({ baseURL: ASS_URL })

const retryConfig = {
    retries: 10,
    retryDelay: (retryCount) => retryCount * 10000,
    retryCondition: (_error) => true
}
axiosRetry(lcdClient, retryConfig)
axiosRetry(fcdClient, retryConfig)
axiosRetry(swapClient, retryConfig)
axiosRetry(assetsClient, retryConfig)

export const { data: { mainnet: whitelist } } = await assetsClient.get("cw20/tokens.json")
export const { data: { mainnet: contracts } } = await assetsClient.get("cw20/contracts.json")