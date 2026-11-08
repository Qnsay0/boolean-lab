"use client";
import { useState, type ReactNode } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { evalBoolean, formatExpr, maxVarIndex, parseBoolean, stages, type Expr } from "@/lib/boolean";
import { ChevronDownIcon } from "lucide-react";

const EXAMPLES = ["!((!a+b)+!d)c", "!a!b", "ab+a!c+bc", "a+b!c"];

const Sym = ({ children }: { children: ReactNode }) => <span className="whitespace-nowrap font-medium">{children}</span>;

type Term = {
  label: string;
  description: ReactNode;
  subThema?: Term[];
};

const terms: Term[] = [
  {
    label: "Czym są minima",
    description: (
      <>
        Miniterm (iloczyn prosty) to koniunkcja (operacja AND, <Sym>∧</Sym>) wszystkich zmiennych wejściowych (w postaci prostej lub zanegowanej), dla której wartość całej funkcji logicznej wynosi 1.
      </>
    ),
    subThema: [
      {
        label: "Jak działa w praktyce",
        description: (
          <>
            W tabeli prawdy miniterm odpowiada tym wierszom, w których wynik funkcji to 1. Oznaczamy je symbolem sumy <Sym>∑</Sym> z indeksem wierszy, w których funkcja przyjmuje wartość prawdy, np. <Sym>∑(1, 3, 7)</Sym>.
          </>
        ),
      },
      {
        label: "Zastosowanie",
        description: (
          <>
            Służą do budowania postaci kanonicznej sumy iloczynów (<Sym>PDNF</Sym>).
          </>
        ),
      },
    ],
  },

  //   2. Makstermy (iloczyn makstermów – ∏)

  // Czym są Maksterm (suma prosta) to alternatywa (operacja OR, ∨) wszystkich zmiennych wejściowych (w postaci prostej lub zanegowanej), dla której wartość całej funkcji logicznej wynosi 0.

  // Jak działa w praktyce W tabeli prawdy maksterm odpowiada tym wierszom, w których wynik funkcji to 0. Oznaczamy je symbolem iloczynu ∏ z indeksem wierszy, w których funkcja przyjmuje fałsz, np. ∏(0, 2, 4).

  // Zastosowanie Służą do budowania postaci kanonicznej iloczynu sum (PCNF).
  {
    label: "Makstermy (iloczyn makstermów – ∏)",
    description: (
      <>
        Maksterm (suma prosta) to alternatywa (operacja OR, <Sym>∨</Sym>) wszystkich zmiennych wejściowych (w postaci prostej lub zanegowanej), dla której wartość całej funkcji logicznej wynosi 0.
      </>
    ),
    subThema: [
      {
        label: "Jak działa w praktyce",
        description: (
          <>
            W tabeli prawdy maksterm odpowiada tym wierszom, w których wynik funkcji to 0. Oznaczamy je symbolem iloczynu <Sym>∏</Sym> z indeksem wierszy, w których funkcja przyjmuje fałsz, np. <Sym>∏(0, 2, 4)</Sym>.
          </>
        ),
      },
      {
        label: "Zastosowanie",
        description: (
          <>
            Służą do budowania postaci kanonicznej iloczynu sum (<Sym>PCNF</Sym>).
          </>
        ),
      },
    ],
  },
];

export default function Home() {
  const [colsCount] = useState<number>(2);
  const [inputValue, setInputValue] = useState<string>("");
  const [checkValue, setCheckValue] = useState<string>("");
  const [expr, setExpr] = useState<Expr | null>(null);
  const [error, setError] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusColor, setSTatusColor] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState({ table: true, solution: true, minima: true });
  const toggle = (panel: keyof typeof isOpen) => setIsOpen((prev) => ({ ...prev, [panel]: !prev[panel] }));

  const solve = (source = inputValue): Expr | null => {
    const trimmed = source.trim();
    if (!trimmed) {
      setExpr(null);
      setError("");
      return null;
    }
    try {
      const parsed = parseBoolean(trimmed);
      setExpr(parsed);
      setError("");
      return parsed;
    } catch (err) {
      setExpr(null);
      setError(err instanceof Error ? err.message : "Nie da się policzyć wyrażenia");
      return null;
    }
  };

  const resultFor = (parsed: Expr | null) => {
    if (!parsed) return "";
    const count = Math.min(Math.max(1, colsCount, maxVarIndex(parsed) + 1), 16);
    return Array.from({ length: 2 ** count }, (_, i) => i.toString(2).padStart(count, "0").split("").map(Number))
      .map((row) => evalBoolean(parsed, row))
      .join("");
  };

  const runExample = (source: string) => {
    setInputValue(source);
    const parsed = solve(source);
    if (checkValue.replace(/[\s,]/g, "")) fail_check(checkValue, parsed, resultFor(parsed));
    else setStatusMessage("");
  };

  const miniterms = (result: string, type: string) => {
    const elements = result.split("");
    const result_min: number[] = [];
    elements.forEach((char, index) => {
      char === (type === "min" ? "1" : "0") ? result_min.push(index) : null;
    });
    return result_min.map(String);
  };

  const pdnf_pcnf = (result: string, type: string) => {
    const rows = miniterms(result, type).map((index) => records[Number(index)]);

    return rows
      .map((row) =>
        row
          .map((bit, i) => {
            const name = String.fromCharCode(65 + i);
            const positive = type === "min" ? bit === 1 : bit === 0;
            return positive ? name : `!${name}`;
          })
          .join(type === "min" ? "" : "+"),
      )
      .map((term) => (type === "min" ? term : `(${term})`))
      .join(type === "min" ? "+" : "");
  };
  const fail_check = (answer = checkValue, nextExpr: Expr | null = expr, nextResult = result) => {
    const cleanUser = answer.replace(/[\s,]/g, "");
    const cleanResult = nextResult.replace(/[\s,]/g, "");

    const fail = (message: string) => {
      setStatusMessage(message);
      setSTatusColor(false);
    };

    if (!nextExpr || !cleanResult) {
      fail("Najpierw wprowadź i rozwiąż wyrażenie");
      return;
    }
    if (!cleanUser) {
      fail("Nie podano odpowiedzi");
      return;
    }
    if (!/^[01]+$/.test(cleanUser)) {
      fail("Podaj poprawne dane (tylko 0 i 1)");
      return;
    }
    if (cleanUser.length !== cleanResult.length) {
      fail(`Odpowiedź ma ${cleanUser.length} bitów, oczekiwano ${cleanResult.length}`);
      return;
    }
    if (cleanUser !== cleanResult) {
      fail("Niepoprawny wynik");
      return;
    }

    setStatusMessage("Poprawny wynik");
    setSTatusColor(true);
    setCheckValue("");
  };

  const needed = expr ? maxVarIndex(expr) + 1 : 0;
  const n = Math.min(Math.max(1, colsCount, needed), 16);
  const totalRows = Math.pow(2, n);
  const records = Array.from({ length: totalRows }, (_, i) => i.toString(2).padStart(n, "0").split("").map(Number));
  const steps = expr ? stages(expr) : [];
  const result = expr ? records.map((row) => evalBoolean(expr, row)).join("") : "";
  const minTerms = miniterms(result, "min").join(", ");
  const maxTerms = miniterms(result, "maks").join(", ");
  const pdnf = pdnf_pcnf(result, "min");
  const pcnf = pdnf_pcnf(result, "maks");

  return (
    <main className="min-h-dvh p-4 lg:px-0">
      <div className="flex w-full min-w-0 flex-col md:flex-row py-10 gap-5 px-4">
        <aside className="md:sticky top-5 flex w-full min-w-0 h-fit shrink-0 flex-col rounded-xl border border-line bg-surface md:top-4 md:w-80">
          <div className="w-full border-b  border-line">
            <div className="border-b border-line">
              <div className="p-5 flex gap-4 items-center flex-row">
                <div className="h-12 w-12">
                  <img src="Logo.svg" className="rounded-lg" />
                </div>
                <h1 className="leading-5 font-bold text-lg">
                  Kalkulator Boolowski <br /> <span className="text-muted text-base font-normal">by Bartłomiej Klimek</span>
                </h1>
              </div>
            </div>
            <div className="p-5">
              <form
                className="flex flex-col gap-3 "
                onSubmit={(event) => {
                  event.preventDefault();
                  const parsed = solve();
                  if (checkValue.replace(/[\s,]/g, "")) fail_check(checkValue, parsed, resultFor(parsed));
                  else setStatusMessage("");
                }}
              >
                <div className="text-base">
                  <h2 className="text-sm font-semibold text-ink">Wprowadź zadanie</h2>
                  <h2 className="text-xs text-muted mt-1">Wprowadź przykładowe zadanie aby zostało ono rozwiązane (Negacje naley zapisać jako ![zmienna])</h2>
                </div>

                <input
                  className="h-11 w-full rounded-lg border border-line bg-bg px-3 font-mono text-ink outline-none focus:border-control-line text-sm"
                  type="text"
                  value={inputValue}
                  autoComplete="off"
                  placeholder="A+B"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = e.target.value;
                    setInputValue(value);
                    const parsed = solve(value);
                    if (checkValue.replace(/[\s,]/g, "")) fail_check(checkValue, parsed, resultFor(parsed));
                    else setStatusMessage("");
                  }}
                />
                {error ? <p className="text-xs text-accent-text">{error}</p> : null}
                <Button type="submit" className="h-11 w-full bg-accent text-white hover:bg-accent-hover text-xs">
                  Rozwiąż zadanie
                </Button>
              </form>
            </div>
          </div>

          <div className="p-5 border-b border-line">
            <div className="my-2">
              <h2 className="text-sm font-semibold text-ink">Przyładowe zadania</h2>
              <p className="text-xs text-muted mt-2">Mają na celu sprawdzenie podstawowego działania aplikacji</p>
            </div>
            <div className="mt-2 flex w-full min-w-0 flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <Button key={ex} type="button" className="h-auto max-w-full shrink whitespace-normal break-all rounded-sm bg-muted/10 px-2 py-1 text-xs hover:bg-muted/5" onClick={() => runExample(ex)}>
                  {ex}
                </Button>
              ))}
            </div>
          </div>

          <div className="p-5">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                fail_check();
              }}
              className="flex flex-col gap-3"
            >
              <div className="text-base">
                <h2 className="text-xs font-semibold text-ink">Sprawdź rozwiązanie</h2>
                <h2 className="text-xs font-medium text-muted mt-2">Wpisz swój wnik końcowy z ostatniej kolumny tabeli i sprawdź poprawnośc wykonania zadania</h2>
              </div>

              <input
                className="h-11 w-full rounded-lg border border-line bg-bg px-3 font-mono text-ink outline-none focus:border-control-line text-sm"
                type="text"
                value={checkValue}
                placeholder="001010001"
                name="input_anwser"
                autoComplete="off"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setCheckValue(e.target.value);
                }}
              />
              {statusMessage && <p className={cn("text-sm", statusColor ? "text-green-400" : "text-red-400")}>{statusMessage}</p>}
              <Button type="submit" className="h-11 w-full bg-accent text-white hover:bg-accent-hover text-xs">
                Sprawdź rozwizanie
              </Button>
            </form>
          </div>
        </aside>
        <section className="flex min-h-0 min-w-0 w-full max-w-full h-fit flex-1 flex-col gap-5 ">
          <div className="min-w-0 max-w-full rounded-xl border border-line bg-surface px-5 py-4 md:px-8">
            <div onClick={() => toggle("table")} className="cursor-pointer border-b border-line">
              <div className={cn("flex flex-row justify-between transition-all duration-300 ease-in-out", isOpen.table ? "py-4" : "py-2")}>
                <div>
                  <h1 className="text-lg font-bold">Tabela Prawdy</h1>
                  <h2 className="mt-2 break-all text-xs font-semibold text-muted">Działanie: {expr ? formatExpr(expr) : "---"}</h2>
                </div>
                <ChevronDownIcon size={18} className={cn("text-muted transition-transform duration-300", isOpen.table && "rotate-180")} />
              </div>
            </div>
            <div className={cn("grid transition-[grid-template-rows] duration-300 ease-in-out", isOpen.table ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden">
                <div className="min-w-0 max-w-full overflow-x-auto mt-4">
                  <table className="w-max min-w-full border-collapse text-center font-mono text-sm">
                    <thead className="sticky top-0 bg-surface-raised text-subtle">
                      <tr className="text-lg">
                        {Array.from({ length: n }, (_, i) => (
                          <th key={`var-${i}`} className="px-2 py-2  text-ink min-w-40">
                            {String.fromCharCode(65 + i)}
                          </th>
                        ))}
                        {steps.map((stage, i) => (
                          <th key={`step-${i}`} className="px-2 py-2 min-w-40">
                            {formatExpr(stage)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-lg text-muted">
                      {records.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-line transition-colors hover:bg-white/5">
                          {row.map((val, colIndex) => (
                            <td key={colIndex} className="whitespace-nowrap px-2 py-2 ">
                              {val}
                            </td>
                          ))}

                          {steps.map((stage, i) => {
                            const last = i === steps.length - 1;
                            return (
                              <td key={`step-${i}`} className="whitespace-nowrap px-2 py-2  text-center">
                                <div className="flex justify-center">
                                  <span className={cn("inline-flex items-center justify-center w-8 py-0.5 rounded-sm border border-dotted text-lg", last ? "border-shift-edge bg-shift-bg" : "bg-extension-bg")}>{evalBoolean(stage, row)}</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-8 flex min-w-0 flex-col gap-3 lg:flex-row lg:gap-8">
                  <span className="flex min-w-0 items-center text-xs">
                    <div className="mr-2 h-6 w-6 shrink-0 rounded-sm border border-extension-edge bg-extension-bg" /> - Rozwiązanie poszczególnych etapów
                  </span>
                  <span className="flex min-w-0 items-center text-xs">
                    <div className="mr-2 h-6 w-6 shrink-0 rounded-sm border border-shift-edge bg-shift-bg" /> - Rozwiązanie poszczególnych etapów
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-5 py-4 md:px-8">
            <div onClick={() => toggle("solution")} className="cursor-pointer border-b border-line">
              <div className={cn("flex flex-row items-center justify-between transition-all duration-300 ease-in-out", isOpen.solution ? "py-4" : "py-2")}>
                <div>
                  <h1 className="text-lg font-bold">Rozwiązanie</h1>
                  <h2 className="mt-2 text-xs font-semibold text-muted">Szczegółowe rozwiązanie zadania wraz z obliczeniem PDNF i PCNF</h2>
                </div>
                <ChevronDownIcon size={18} className={cn("shrink-0 text-muted transition-transform duration-300", isOpen.solution && "rotate-180")} />
              </div>
            </div>
            <div className={cn("grid transition-[grid-template-rows] duration-300 ease-in-out", isOpen.solution ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden">
                <div className="grid gap-3 py-4 sm:grid-cols-2">
                  <div className="min-w-0 rounded-lg border border-line bg-bg px-4 py-3">
                    <p className="text-xs font-semibold text-muted">Minitermy</p>
                    <p className="mt-1 break-all font-mono text-sm text-ink">&sum;({minTerms})</p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-line bg-bg px-4 py-3">
                    <p className="text-xs font-semibold text-muted">Makstermy</p>
                    <p className="mt-1 break-all font-mono text-sm text-ink">&prod;({maxTerms})</p>
                  </div>
                </div>
                <div className="grid gap-3 pb-1">
                  <div className="min-w-0 rounded-lg border border-line bg-bg px-4 py-3">
                    <p className="text-xs font-semibold text-muted">PDNF</p>
                    <p className="mt-1 break-all font-mono text-sm text-ink">{pdnf.trim() || "—"}</p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-line bg-bg px-4 py-3">
                    <p className="text-xs font-semibold text-muted">PCNF</p>
                    <p className="mt-1 break-all font-mono text-sm text-ink">{pcnf.trim() || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full min-w-0 h-fit shrink-0 flex-col rounded-xl border border-line bg-surface p-5 duration-300 ease-in-out">
            <div onClick={() => toggle("minima")} className="cursor-pointer border-b border-line">
              <div className={cn("flex flex-row justify-between transition-all duration-300 ease-in-out", isOpen.minima ? "py-4" : "py-2")}>
                <div>
                  <h1 className="text-lg font-bold">Podstawowe zagadnienia</h1>
                  <h2 className="mt-2 break-all text-xs font-semibold text-muted">Njawazniejsze pojęcia kluczowe do zrozumienia teorii Boolowskiej</h2>
                </div>
                <ChevronDownIcon size={18} className={cn("text-muted transition-transform duration-300", isOpen.minima && "rotate-180")} />
              </div>
            </div>
            {isOpen.minima ? (
              <div className="mt-5 flex flex-col gap-6">
                {terms.map((term) => (
                  <div key={term.label} className="flex flex-col gap-2 text-base pb-8 border-b border-line">
                    <p className="font-bold bg-amber-50/4 p-2 rounded-sm">{term.label}</p>
                    <p>{term.description}</p>
                    {term.subThema?.map((sub) => (
                      <div key={sub.label} className="mt-2 flex flex-col gap-1 border-l border-line pl-4">
                        <p className="font-semibold">{sub.label}</p>
                        <p>{sub.description}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
