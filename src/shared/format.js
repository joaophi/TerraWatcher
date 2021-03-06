import BigNumber from "bignumber.js";
import { DateTime } from "luxon";
import { truncate } from "terra-utils";

const formatDecimal = (number) => new BigNumber(number)
  .decimalPlaces(6, BigNumber.ROUND_DOWN)
  .toFixed(6)

const formatAmount = (amount, decimals = 6) => new BigNumber(amount)
  .div(new BigNumber(10).pow(decimals))
  .decimalPlaces(6, BigNumber.ROUND_DOWN)
  .toFormat(6)

const formatDenom = (denom) => {
  if (!denom) {
    return ""
  }

  if (denom[0] === "u") {
    const f = denom.slice(1)

    if (f.length > 3) {
      return f === "luna" ? "Luna" : f.toUpperCase()
    }

    return f.slice(0, 2).toUpperCase() + "T"
  }

  return denom;
};

const formatLabel = (address, label) => {
  if (label) {
      return `${label} (${truncate(address)})`
  } else {
      return address
  }
}

const formatCoin = ({ amount, denom }) => [formatAmount(amount), formatDenom(denom)].join(" ")

const format = {
  decimal: formatDecimal,
  amount: formatAmount,
  denom: formatDenom,
  coin: formatCoin,
  coins: (coins) => coins.map(formatCoin),
  label: formatLabel,

  date: (param) => {
    const dt =
      typeof param === "string"
        ? DateTime.fromISO(param)
        : DateTime.fromJSDate(param)

    const formatted = dt
      .setLocale("en")
      .toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS)

    return param ? formatted + ` (UTC)` : ""
  },

  truncate: (address = "", [h, t]) => {
    const head = address.slice(0, h)
    const tail = address.slice(-1 * t, address.length)
    return !address
      ? ""
      : address.length > h + t
        ? [head, tail].join("…")
        : address
  }
}

export default format