import axios from "axios";

export const lcdClient = axios.create({
    baseURL: "https://lcd.terra.dev"
})

export const fcdClient = axios.create({
    baseURL: "https://fcd.terra.dev"
})

export const swapClient = axios.create({
    baseURL: "https://api.terraswap.io"
})

export const assetsClient = axios.create({
    baseURL: "https://assets.terra.money"
})