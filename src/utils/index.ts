import { QueryParams } from "../types";

export default function buildQueryString(
  params?: QueryParams,
  prefix = ""
): string {
  if (!params) return "";

  return Object.keys(params)
    .map((key) => {
      const value = params[key];
      const prefixedKey = prefix ? `${prefix}[${key}]` : key;

      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        value !== null
      ) {
        return buildQueryString(value as QueryParams, prefixedKey);
      } else if (Array.isArray(value)) {
        return value
          .map((item, idx) => {
            if (
              typeof item === "object" &&
              item !== null &&
              !Array.isArray(item)
            ) {
              return buildQueryString(
                item as QueryParams,
                `${prefixedKey}[${idx}]`
              );
            }
            return `${prefixedKey}[${idx}]=${encodeURIComponent(
              item
            )}`;
          })
          .join("&");
      } else if (value !== undefined && value !== null) {
        return `${prefixedKey}=${encodeURIComponent(value)}`;
      }

      return "";
    })
    .filter((param) => param !== "")
    .join("&");
}
