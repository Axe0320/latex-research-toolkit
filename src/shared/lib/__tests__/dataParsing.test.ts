import { describe, it, expect } from 'vitest'
import { parseCSV } from '../dataParsing/parseCSV'
import { parseTSV } from '../dataParsing/parseTSV'

describe('parseCSV', () => {
  it('splits simple comma-separated lines', () => {
    expect(parseCSV('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('skips blank lines', () => {
    expect(parseCSV('a,b\n\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('keeps commas inside quoted fields intact', () => {
    expect(parseCSV('name,note\n"Doe, John",hello')).toEqual([
      ['name', 'note'],
      ['Doe, John', 'hello'],
    ])
  })

  it('unescapes doubled quotes inside quoted fields', () => {
    expect(parseCSV('a\n"She said ""hi"""')).toEqual([
      ['a'],
      ['She said "hi"'],
    ])
  })

  it('handles an empty trailing field', () => {
    expect(parseCSV('a,b,\n1,2,')).toEqual([
      ['a', 'b', ''],
      ['1', '2', ''],
    ])
  })
})

describe('parseTSV', () => {
  it('splits tab-separated lines', () => {
    expect(parseTSV('a\tb\tc\n1\t2\t3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('skips blank lines', () => {
    expect(parseTSV('a\tb\n\n1\t2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('does not treat commas specially', () => {
    expect(parseTSV('name\tnote\nDoe, John\thello')).toEqual([
      ['name', 'note'],
      ['Doe, John', 'hello'],
    ])
  })
})
