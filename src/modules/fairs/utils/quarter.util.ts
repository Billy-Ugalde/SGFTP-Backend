
export type Quarter = 1 | 2 | 3 | 4;
export type RomanQuarter = 'I' | 'II' | 'III' | 'IV';

const ROMAN_QUARTERS: Record<Quarter, RomanQuarter> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
};

export function quarterToRoman(q: Quarter): RomanQuarter {
  return ROMAN_QUARTERS[q];
}
