export const FINDER = "https://finder.terra.money";

const getFinderLink = (text, type, address) => {
    return `[${text}](${FINDER}/mainnet/${type}/${address})`
};

export default getFinderLink;