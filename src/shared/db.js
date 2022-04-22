import "dotenv/config"
import pg from "pg"

export const db = new pg.Pool()