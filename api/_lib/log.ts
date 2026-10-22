// Function logs carry route, outcome and milliseconds only: never an email, a code, an address or a body.

export type Log = (line: string) => void

export function logLine(log: Log, route: string, outcome: string, started: number) {
  log(JSON.stringify({ route, outcome, ms: Math.round(performance.now() - started) }))
}
