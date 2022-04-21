import axios from "axios";

export const LCD_URL = process.env["LCD_URL"] ?? "https://lcd.terra.dev"
export const FCD_URL = process.env["FCD_URL"] ?? "https://fcd.terra.dev"
export const SWP_URL = process.env["SWP_URL"] ?? "https://api.terraswap.io"
export const ASS_URL = process.env["ASS_URL"] ?? "https://assets.terra.money"

export const lcdClient = axios.create({ baseURL: LCD_URL })
export const fcdClient = axios.create({ baseURL: FCD_URL })
export const swapClient = axios.create({ baseURL: SWP_URL })
export const assetsClient = axios.create({ baseURL: ASS_URL })

export const { data: { mainnet: whitelist } } = await assetsClient.get("cw20/tokens.json")
export const { data: { mainnet: contracts } } = await assetsClient.get("cw20/contracts.json")