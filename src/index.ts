/**
 * The function `explode` takes a string and a mapping object, replaces placeholders in the string with values from the
 * mapping, and returns the exploded string.
 * @param {string} str - The `str` parameter is a string that may contain placeholders in the form of `${key}` or `$key`,
 * where `key` is a key that corresponds to a value in the `mapping` object.
 * The function `explode` replaces these placeholders with the
 * corresponding values from the `mapping` object and returns the explodeed
 * @param mapping - The `mapping` parameter is an object that maps keys to their corresponding values. In the `explode`
 * function, it is used to replace placeholders in the `str` parameter with actual values. If a key in the mapping object
 * matches a placeholder in the string, the placeholder is replaced with the corresponding
 * @returns The `explode` function returns a string with placeholders replaced by values from the `mapping` object.
 * If a placeholder does not have a corresponding key in the `mapping` object, it is replaced with an empty string.
 *
 * @example
 * explode("Hello, $name!", { name: "World" }); // "Hello, World!"
 *
 * @example
 * explode("Hello, ${name}!", { name: "World" }); // "Hello, World!"
 */
export function explode(
  str: string,
  mapping: Record<string, string | undefined>
): string {
  let buffer = "";
  let i = 0;
  for (let j = 0; j < str.length; j++) {
    if (str[j] === "$") {
      buffer += str.slice(i, j);
      const { key, length } = getTemplateKey(str.slice(j + 1));
      if (key === "") {
        // $ not followed by a valid template, just add the $ to the buffer
        buffer += str.slice(j, j + length + 1);
      } else {
        buffer += mapping[key] ?? "";
      }
      j += length;
      i = j + 1;
    }
  }

  buffer += str.slice(i);

  return buffer;
}

/**
 * The function `explodeEnv` takes a string as input and expands any environment variables present in the string using the
 * `process.env` object in runtime.
 *
 * This is an alias for `explode(str, process.env)`.
 *
 * @param {string} str - A string that may contain environment variable references to be explodeed in the form of `${key}`
 * or `$key` where `key` is an environment variable.
 * @returns The string with the environment variables explodeed.
 * Keys with no corresponding environment variable will be replaced with an empty string.
 *
 * @example
 * explodeEnv("Hello, $USER!"); // "Hello, username!"
 *
 * @example
 * explodeEnv("Hello, ${USER}!"); // "Hello, username!"
 */
export function explodeEnv(str: string): string {
  return explode(str, process.env);
}

function getTemplateKey(str: string): { key: string; length: number } {
  if (str[0] === "{") {
    const end = str.indexOf("}");
    if (end === 1) {
      // Invalid template ${}
      return { key: "", length: 2 };
    } else if (end === -1) {
      // Invalid template ${key
      const key = str.slice(0);
      return { key: "", length: key.length };
    }
    return { key: str.slice(1, end), length: end + 1 };
  }
  if (isShellSpecialVar(str[0])) {
    return { key: "", length: 0 };
  }
  let i = 0;
  while (i < str.length && isAlphaNumeric(str[i])) {
    i++;
  }

  return {
    key: str.slice(0, i),
    length: i,
  };
}

function isAlphaNumeric(char: string): boolean {
  return (
    char === "_" ||
    (char >= "a" && char <= "z") ||
    (char >= "A" && char <= "Z") ||
    (char >= "0" && char <= "9")
  );
}

function isShellSpecialVar(char: string): boolean {
  return [
    "*",
    "#",
    "$",
    "@",
    "!",
    "?",
    "-",
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
  ].includes(char);
}
