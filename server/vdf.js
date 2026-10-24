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
