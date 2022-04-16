import { truncate } from "terra-utils";

export const FINDER = "https://finder.terra.money";

export const LABELS = new Map()

export const loadLabels = async (db) => {
    const lbls = await db.all(
        `SELECT address, label
         FROM label`
    )
    LABELS.clear()
    lbls.forEach(({ address, label }) => LABELS.set(address, label));
}

const getFinderLink = (text, type, address) => {
    if (LABELS.has(address)) {
        text = `${LABELS.get(address)} - ${truncate(address)}`
    }

    return `[${text}](${FINDER}/mainnet/${type}/${address})`
};

export default getFinderLink;