import pg from "pg"

export const db = new pg.Client({
    host: "terra-watch.duckdns.org",
    port: 5432,
    user: "fcd",
    password: "fcd",
    database: "fcd"
})

await db.connect()