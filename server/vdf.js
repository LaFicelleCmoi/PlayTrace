/**
 * Parseur minimal du format texte KeyValues (VDF) de Valve :
 * `"clé" "valeur"` ou `"clé" { … }`. Les clés sont mises en minuscules,
 * Steam n'étant pas constant sur la casse (`StateFlags` / `stateflags`).
 */
export function parseVdf(text) {
  const root = {};
  const stack = [root];
  let key = null;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (char === '"') {
      let value = '';
      i += 1;
      while (i < text.length && text[i] !== '"') {
        if (text[i] === '\\' && i + 1 < text.length) i += 1;
        value += text[i];
        i += 1;
      }
      i += 1;
      if (key === null) {
        key = value.toLowerCase();
      } else {
        stack.at(-1)[key] = value;
        key = null;
      }
    } else if (char === '{') {
      const child = {};
      if (key !== null) stack.at(-1)[key] = child;
      stack.push(child);
      key = null;
      i += 1;
    } else if (char === '}') {
      if (stack.length > 1) stack.pop();
      key = null;
      i += 1;
    } else if (char === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i += 1;
    } else {
      i += 1;
    }
  }

  return root;
}

const BINARY_MAP = 0;
const BINARY_STRING = 1;
const BINARY_INT32 = 2;
const BINARY_END = 8;

/** Parseur du format binaire de Valve (`shortcuts.vdf`). Clés en minuscules, comme `parseVdf`. */
export function parseBinaryVdf(buffer) {
  let offset = 0;

  const readString = () => {
    const end = buffer.indexOf(0, offset);
    if (end === -1) throw new Error('VDF binaire tronqué');
    const value = buffer.toString('utf8', offset, end);
    offset = end + 1;
    return value;
  };

  const readMap = () => {
    const map = {};
    while (offset < buffer.length) {
      const type = buffer[offset];
      offset += 1;
      if (type === BINARY_END) return map;
      const key = readString().toLowerCase();
      if (type === BINARY_MAP) {
        map[key] = readMap();
      } else if (type === BINARY_STRING) {
        map[key] = readString();
      } else if (type === BINARY_INT32) {
        map[key] = buffer.readUInt32LE(offset);
        offset += 4;
      } else {
        throw new Error(`VDF binaire : type ${type} inconnu`);
      }
    }
    return map;
  };

  return readMap();
}
