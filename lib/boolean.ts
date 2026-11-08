export type Expr = { type: "var"; index: number } | { type: "const"; value: 0 | 1 } | { type: "not"; expr: Expr } | { type: "or"; left: Expr; right: Expr } | { type: "and"; left: Expr; right: Expr } | { type: "xor"; left: Expr; right: Expr };

type Token = { type: "var"; index: number } | { type: "const"; value: 0 | 1 } | { type: "not" } | { type: "prime" } | { type: "or" } | { type: "and" } | { type: "xor" } | { type: "lp" } | { type: "rp" };

const PREC = { or: 1, xor: 2, and: 3, not: 4 } as const;

export function stages(expr: Expr): Expr[] {
  switch (expr.type) {
    case "var":
    case "const":
      return [];
    case "not":
      return [...stages(expr.expr), expr];
    case "or":
    case "and":
    case "xor":
      return [...stages(expr.left), ...stages(expr.right), expr];
  }
}

export function formatExpr(expr: Expr): string {
  switch (expr.type) {
    case "var":
      return String.fromCharCode(65 + expr.index);
    case "const":
      return String(expr.value);
    case "not": {
      const inner = formatExpr(expr.expr);
      return prec(expr.expr) < PREC.not ? `!(${inner})` : `${inner}\u0304`;
    }
    case "or":
    case "and":
    case "xor": {
      const op = expr.type === "or" ? "+" : expr.type === "and" ? "×" : "^";
      return `${side(expr.left, expr, "left")}${op}${side(expr.right, expr, "right")}`;
    }
  }
}

function prec(expr: Expr): number {
  return expr.type in PREC ? PREC[expr.type as keyof typeof PREC] : 5;
}
function side(child: Expr, parent: Expr, place: "left" | "right"): string {
  const text = formatExpr(child);
  const wrap = place === "right" ? prec(child) <= prec(parent) : prec(child) < prec(parent);
  return wrap ? `(${text})` : text;
}

export function parseBoolean(input: string): Expr {
  const tokens = tokenize(input);
  if (tokens.length === 0) throw new Error("Puste wyrażenie");

  let i = 0;
  const peek = () => tokens[i];
  const eat = () => tokens[i++];

  const parseOr = (): Expr => {
    let left = parseXor();
    while (peek()?.type === "or") {
      eat();
      left = { type: "or", left, right: parseXor() };
    }
    return left;
  };

  const parseXor = (): Expr => {
    let left = parseAnd();
    while (peek()?.type === "xor") {
      eat();
      left = { type: "xor", left, right: parseAnd() };
    }
    return left;
  };

  const parseAnd = (): Expr => {
    let left = parseNot();
    while (continuesAnd()) {
      if (peek()?.type === "and") eat();
      left = { type: "and", left, right: parseNot() };
    }
    return left;
  };

  const continuesAnd = () => {
    const token = peek();
    if (!token) return false;
    return token.type === "and" || token.type === "var" || token.type === "not" || token.type === "lp" || token.type === "const";
  };

  const parseNot = (): Expr => {
    if (peek()?.type === "not") {
      eat();
      return { type: "not", expr: parseNot() };
    }
    return parsePostfix();
  };

  const parsePostfix = (): Expr => {
    let node = parsePrimary();
    while (peek()?.type === "prime") {
      eat();
      node = { type: "not", expr: node };
    }
    return node;
  };

  const parsePrimary = (): Expr => {
    const token = eat();
    if (!token) throw new Error("Niepełne wyrażenie");
    if (token.type === "var") return { type: "var", index: token.index };
    if (token.type === "const") return token;
    if (token.type === "lp") {
      const inner = parseOr();
      if (peek()?.type !== "rp") throw new Error("Brak )");
      eat();
      return inner;
    }
    throw new Error("Niepełne wyrażenie");
  };

  const expr = parseOr();
  if (i !== tokens.length) throw new Error("Niepełne wyrażenie");
  return expr;
}

export function evalBoolean(expr: Expr, row: readonly number[]): 0 | 1 {
  switch (expr.type) {
    case "var":
      return row[expr.index] ? 1 : 0;
    case "const":
      return expr.value;
    case "not":
      return evalBoolean(expr.expr, row) === 0 ? 1 : 0;
    case "or":
      return evalBoolean(expr.left, row) | evalBoolean(expr.right, row) ? 1 : 0;
    case "and":
      return evalBoolean(expr.left, row) & evalBoolean(expr.right, row) ? 1 : 0;
    case "xor":
      return evalBoolean(expr.left, row) ^ evalBoolean(expr.right, row) ? 1 : 0;
  }
}

export function maxVarIndex(expr: Expr): number {
  switch (expr.type) {
    case "var":
      return expr.index;
    case "const":
      return -1;
    case "not":
      return maxVarIndex(expr.expr);
    case "or":
    case "and":
    case "xor":
      return Math.max(maxVarIndex(expr.left), maxVarIndex(expr.right));
  }
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  const source = input.replace(/\s+/g, "");

  for (const char of source) {
    if (/[A-Za-z]/.test(char)) {
      const index = char.toUpperCase().charCodeAt(0) - 65;
      if (index > 15) throw new Error(`Zmienna ${char} jest poza A–P`);
      tokens.push({ type: "var", index });
      continue;
    }
    if (char === "0" || char === "1") {
      tokens.push({ type: "const", value: char === "1" ? 1 : 0 });
      continue;
    }
    if (char === "+" || char === "|" || char === "∨") {
      tokens.push({ type: "or" });
      continue;
    }
    if (char === "*" || char === "·" || char === "&" || char === "∧" || char === "⋅") {
      tokens.push({ type: "and" });
      continue;
    }
    if (char === "^" || char === "⊕") {
      tokens.push({ type: "xor" });
      continue;
    }
    if (char === "!" || char === "~" || char === "¬") {
      tokens.push({ type: "not" });
      continue;
    }
    if (char === "'") {
      tokens.push({ type: "prime" });
      continue;
    }
    if (char === "(") {
      tokens.push({ type: "lp" });
      continue;
    }
    if (char === ")") {
      tokens.push({ type: "rp" });
      continue;
    }
    throw new Error(`Nieznany znak „${char}”`);
  }

  return tokens;
}
