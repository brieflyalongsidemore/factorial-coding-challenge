import { sql } from "drizzle-orm";

/**
 *
 * @param arr Array of strings
 * @returns   Array of strings casted to UUID
 */
export const castArrayOfStringsToUUID = (arr: string[]) => {
  const formattedArray = arr.map((id) => `'${id}'`).join(", ");
  const sqlArr = sql.raw(`ARRAY[${formattedArray}]::uuid[]`);
  return sqlArr;
};
