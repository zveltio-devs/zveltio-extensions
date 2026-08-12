/**
 * Romanian national identifier (CNP), for whoever asks the instance what a
 * valid one looks like.
 *
 * Registered on the service registry as `identity.nationalId`. `hr/employees`
 * looks it up when somebody types a national identifier and applies it if it is
 * there — it does not know what a CNP is, and should not: a CNP, an NI number
 * and a social security number share nothing but a column. An HR module that
 * hard-codes one of them only fits one country.
 *
 * The first version of this check lived inside `hr/employees` and was moved
 * here for exactly that reason.
 *
 * Structure, not existence: it confirms the number COULD be a CNP — century and
 * gender marker, a real calendar date, a real county code, and the control
 * digit — not that it belongs to the person in front of you. The control digit
 * is the point: it catches transposed digits, which a length check never does,
 * and a transposed digit is the common typo.
 */
export function isValidCnp(value: string): boolean {
  const cnp = String(value).trim();
  if (!/^\d{13}$/.test(cnp)) return false;

  // First digit: century + gender. 1-6 are residents by birth century; 7-9
  // cover foreign residents and people born abroad. 0 is not issued.
  const s = Number(cnp[0]);
  if (s === 0) return false;

  const yy = Number(cnp.slice(1, 3));
  const mm = Number(cnp.slice(3, 5));
  const dd = Number(cnp.slice(5, 7));
  const century =
    s === 1 || s === 2 ? 1900 : s === 3 || s === 4 ? 1800 : s === 5 || s === 6 ? 2000 : 1900;
  if (mm < 1 || mm > 12) return false;
  const daysInMonth = new Date(Date.UTC(century + yy, mm, 0)).getUTCDate();
  if (dd < 1 || dd > daysInMonth) return false;

  // County: 01-46, plus 51/52 for the Bucharest sectors that used them.
  const county = Number(cnp.slice(7, 9));
  if (county < 1 || (county > 46 && county !== 51 && county !== 52)) return false;

  const key = '279146358279';
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(cnp[i]) * Number(key[i]);
  const rest = sum % 11;
  return (rest === 10 ? 1 : rest) === Number(cnp[12]);
}
