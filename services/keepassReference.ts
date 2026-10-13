import * as kdbxweb from 'kdbxweb';
import type { Entry } from './types';

function getPropertyNameFromCode(code: string): string {
  switch (code) {
    case 'T':
      return 'title';
    case 'U':
      return 'userName';
    case 'P':
      return 'password';
    case 'A':
      return 'url';
    case 'N':
      return 'notes';
    case 'I':
      return 'id';
    case 'O':
      return '*';
  }
  return '';
}

// https://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
function camelize(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
      index == 0 ? letter.toLowerCase() : letter.toUpperCase()
    )
    .replace(/\s+/g, '');
}

export class KeepassReference {
  majorVersion = 3; // Defaults to 3, unless told otherwise

  hasReferences(fieldValue: string | undefined): boolean {
    return !!/\{.+\}/.test(fieldValue || '');
  }

  /**
   * Process all references found in fieldValue to their final values
   */
  processAllReferences(
    majorVersion: number,
    fieldValue: string | undefined,
    currentEntry: Entry,
    allEntries: Entry[]
  ): string {
    this.majorVersion = majorVersion; // update the major version if it changed.
    const re = /(\{[^{}]+\})/g;
    let expressions = re.exec(fieldValue || '');
    if (!expressions) return fieldValue || ''; // no references

    let result = '';
    let lastIndex = 0;
    while (expressions) {
      if (expressions.index >= lastIndex) {
        result += (fieldValue || '').substring(lastIndex, expressions.index);
      }
      result += this.resolveReference(expressions[1], currentEntry, allEntries);
      lastIndex = expressions.index + expressions[1].length;
      expressions = re.exec(fieldValue || '');
    }

    if (lastIndex < (fieldValue || '').length) {
      result += (fieldValue || '').substring(lastIndex, (fieldValue || '').length);
    }
    return result;
  }

  keewebGetDecryptedFieldValue(entry: Entry, fieldName: string): string {
    if (entry.protectedData === undefined || !(fieldName in entry.protectedData)) {
      return (entry[fieldName] as string) || ''; // not an encrypted field
    }
    return new kdbxweb.ProtectedValue(
      new Uint8Array(entry.protectedData[fieldName].value).buffer,
      new Uint8Array(entry.protectedData[fieldName].salt).buffer
    ).getText();
  }

  getFieldValue(currentEntry: Entry, fieldName: string, allEntries: Entry[]): string {
    // entries are JSON serializable.
    // Convert back to a keeweb.ProtectedValue for parsing.
    const plainText = this.keewebGetDecryptedFieldValue(currentEntry, fieldName);
    return this.processAllReferences(this.majorVersion, plainText, currentEntry, allEntries);
  }

  resolveReference(referenceText: string, currentEntry: Entry, allEntries: Entry[]): string {
    const localParts = /^\{([a-zA-Z]+)\}$/.exec(referenceText);
    if (localParts) {
      // local field
      switch (localParts[1].toUpperCase()) {
        case 'TITLE':
          return currentEntry.title as string;
        case 'USERNAME':
          return currentEntry.userName as string;
        case 'URL':
          return currentEntry.url as string;
        case 'NOTES':
          return currentEntry.notes as string;
        case 'PASSWORD':
          return currentEntry.password as string;
      }
    }

    const customLocalString = /^\{S:([a-zA-Z]+)\}$/.exec(referenceText);
    if (customLocalString) {
      const camelCase = camelize(customLocalString[1]);
      return currentEntry[camelCase] as string;
    }

    const refString = /^\{REF:(T|U|P|A|N|I)@(T|U|P|A|N|I|O):(.+)\}$/.exec(referenceText);
    if (refString) {
      const wantedField = getPropertyNameFromCode(refString[1]);
      const searchIn = getPropertyNameFromCode(refString[2]);
      const text = refString[3];

      const matches = allEntries.filter((e) => {
        if (searchIn === '*') {
          const customFieldMatches = e.keys.filter((key) => {
            return String(e[key] || '').indexOf(text) !== -1;
          });
          return customFieldMatches.length > 0;
        } else if (searchIn === 'id') {
          return String(e[searchIn]).toLowerCase() === text.toLowerCase();
        } else {
          return String(e[searchIn] || '').indexOf(text) !== -1;
        }
      });
      if (matches.length) {
        if (this.majorVersion >= 3) {
          return this.keewebGetDecryptedFieldValue(matches[0], wantedField);
        } else {
          throw new Error('Database Version Not Supported');
        }
      }
    }

    return referenceText;
  }
}
