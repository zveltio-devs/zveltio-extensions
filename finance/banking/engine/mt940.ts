/**
 * MT940 statement parser.
 *
 * The previous regex was
 *
 *     /:61:(\d{6})(\d{4})?(C|D)(\d+,\d+)N(\w+)(.*)?/
 *
 * and a `:61:` line that did not match was skipped — no error, no count, no
 * log. Five of seven legal line shapes were dropped that way, measured against
 * lines banks actually send:
 *
 *     :61:...C1500,00NTRF...      parsed
 *     :61:...D250,50NTRF...       parsed
 *     :61:...RC1500,00NTRF...     DROPPED   reversal of a credit
 *     :61:...RD250,50NTRF...      DROPPED   reversal of a debit
 *     :61:...CR1500,00NTRF...     DROPPED   funds code after the mark
 *     :61:...C1000,NTRF...        DROPPED   amount with no fractional part
 *     :61:...C99,90STRF...        DROPPED   transaction code starting S, not N
 *
 * Reversals are the worst of those. A reversal is how a bank undoes a
 * transaction, so dropping every one means an imported statement shows money
 * that came in and never shows it going back out — and the account balance,
 * which this import adds up, is wrong in the customer's favour with nothing
 * anywhere saying a line was skipped.
 *
 * What changed:
 *   * `RC`/`RD` are recognised and invert the direction, which is what a
 *     reversal means: an RC undoes a credit, so it moves money out.
 *   * the optional one-character funds code after the mark is allowed;
 *   * the amount's fractional part is optional, as the format allows;
 *   * the transaction code may start N, S or F;
 *   * `:86:` narrative continues across following lines until the next tag,
 *     instead of taking only the first;
 *   * and a `:61:` line that still does not parse is REPORTED rather than
 *     skipped. An import that silently drops rows is worse than one that
 *     refuses: the operator reconciles against a total that was never right.
 */
export interface MT940Result {
  transactions: Array<{
    date: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    reference: string;
    /** True for RC/RD — the line undoes an earlier movement. */
    reversal: boolean;
  }>;
  /** `:61:` lines that could not be read, verbatim, for the operator to see. */
  unparsed: string[];
}

const MT940_LINE =
  /^:61:(\d{6})(\d{4})?(RC|RD|C|D)([A-Z])?(\d+,\d*)([NSF]\w{0,3})(.*)?$/;

export function parseMT940(text: string): MT940Result {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const transactions: MT940Result['transactions'] = [];
  const unparsed: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = (lines[i] ?? '').trim();
    if (!line.startsWith(':61:')) {
      i++;
      continue;
    }

    const match = line.match(MT940_LINE);
    if (!match) {
      unparsed.push(line);
      i++;
      continue;
    }

    const [, ymd, , mark, , rawAmount, , rest] = match;
    const yy = ymd!.slice(0, 2);
    const year = Number.parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    const date = `${year}-${ymd!.slice(2, 4)}-${ymd!.slice(4, 6)}`;

    // An RC undoes a credit, so the money moves the other way. Recording it as a
    // credit — which is what dropping the R would do — would double-count the
    // original instead of cancelling it.
    const reversal = mark === 'RC' || mark === 'RD';
    const credit = mark === 'C' || mark === 'RD';
    const amount = Number.parseFloat(rawAmount!.replace(',', '.').replace(/\.$/, ''));

    // The narrative runs from `:86:` until the next tag, not just one line.
    let description = '';
    let j = i + 1;
    if ((lines[j] ?? '').startsWith(':86:')) {
      description = (lines[j] ?? '').slice(4).trim();
      j++;
      while (j < lines.length && !(lines[j] ?? '').trimStart().startsWith(':')) {
        description += ` ${(lines[j] ?? '').trim()}`;
        j++;
      }
      description = description.trim();
    }

    transactions.push({
      date,
      type: credit ? 'credit' : 'debit',
      amount,
      description,
      reference: (rest ?? '').trim(),
      reversal,
    });
    i = j;
  }

  return { transactions, unparsed };
}
