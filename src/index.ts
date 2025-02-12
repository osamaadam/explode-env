type Options = {
  /**
   * If `true`, the function will not replace placeholders that do not have a corresponding key in the `mapping` object.
   *
   * @default false
   * @example
   * const exploded = explode("Hello, $name! or $USER", { USER: "you" }, { ignoreUnsetVars: true });
   * console.log(exploded) // "Hello, $name! or you"
   */
  ignoreUnsetVars?: boolean;

  /**
   * If `true`, the function will ignore parameter expansion in the form of `${key:-defaultValue}` or `${key:=defaultValue}.
   *
   * @see {@link https://pubs.opengroup.org/onlinepubs/009695399/utilities/xcu_chap02.html#tag_02_06_02}
   *
   * @default false
   * @example
   * const exploded = explode("Hello, ${name:=World}!", {}, { ignoreDefaultExpansion: true });
   * console.log(exploded) // "Hello, !"
   *
   * @example
   * const exploded = explode("Hello, ${name:=World}!", {}, { ignoreDefaultExpansion: false });
   * console.log(exploded) // "Hello, World!"
   */
  ignoreDefaultExpansion?: boolean;
};

const DEFAULT_OPTIONS: Options = {
  ignoreUnsetVars: false,
  ignoreDefaultExpansion: false,
};

/**
 * The function `explode` takes a string and a mapping object, replaces placeholders in the string with values from the
 * mapping, and returns the exploded string.
 * @param {string} str - The `str` parameter is a string that may contain placeholders in the form of `${key}` or `$key`,
 * where `key` is a key that corresponds to a value in the `mapping` object.
 * The function `explode` replaces these placeholders with the
 * corresponding values from the `mapping` object and returns the explodeed
 * @param m - The `mapping` parameter is an object that maps keys to their corresponding values. In the `explode`
 * function, it is used to replace placeholders in the `str` parameter with actual values. If a key in the mapping object
 * matches a placeholder in the string, the placeholder is replaced with the corresponding
 * @param options - The `options` parameter is an optional object that can be used to configure the behavior of the `explode`
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
  mapping: Record<string, string | undefined>,
  options: Options = DEFAULT_OPTIONS
): string {
  const m = { ...mapping };
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
        const [realKey, defaultValue] = key.split(/:=|:-/);
        if (realKey in m) {
          buffer += m[realKey];
        } else {
          if (defaultValue && !options.ignoreDefaultExpansion) {
            buffer += defaultValue;
          } else if (options.ignoreUnsetVars) {
            buffer += str.slice(j, j + length + 1);
          }
        }

        if (
          !options.ignoreDefaultExpansion &&
          !(realKey in m) &&
          defaultValue?.length &&
          key.includes(":=")
        ) {
          // Add the default to the mapping if the key is set like ${key:=default}
          m[realKey] = defaultValue;
        }
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
 * @param options - The `options` parameter is an optional object that can be used to configure the behavior of the `explode`
 * @returns The string with the environment variables explodeed.
 * Keys with no corresponding environment variable will be replaced with an empty string.
 *
 * @example
 * explodeEnv("Hello, $USER!"); // "Hello, username!"
 *
 * @example
 * explodeEnv("Hello, ${USER}!"); // "Hello, username!"
 */
export function explodeEnv(
  str: string,
  options: Options = DEFAULT_OPTIONS
): string {
  return explode(str, process.env, options);
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
