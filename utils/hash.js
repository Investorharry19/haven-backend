import * as argon2 from "argon2";

export const hashFunction = async (password) => {
  const result = await argon2.hash(password);
  return result;
};
