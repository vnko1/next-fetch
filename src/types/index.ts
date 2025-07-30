export type QueryParams = Record<
  string,
  | string
  | number
  | boolean
  | undefined
  | object
  | (string | number | boolean | undefined | object)[]
>;
