import { vi, describe, expect, test } from "vitest";
import {
  validateEmail,
  validateURL,
  validateDOI,
  validateField
} from '../validate';

// Mock Firebase dependencies to avoid "ReadableStream" errors and side effects
// (Note: Global mocks in setupTests.js might handle this, but explicit mocking here is safe)
vi.mock("firebase/functions", () => ({
  getFunctions: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn()),
}));

vi.mock("../../firebase", () => ({ default: {} }));

describe('Utility: validate.js', () => {

  describe('Basic Validators', () => {
    test('validateEmail', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(true);
    });

    test('validateURL', () => {
      expect(validateURL('https://google.com')).toBe(true);
      expect(validateURL('not-a-url')).toBe(false);
      expect(validateURL('')).toBe(true);
    });

    test('validateDOI', () => {
      // Logic requires full URL
      expect(validateDOI('10.1000/xyz123')).toBe(false);
      expect(validateDOI('https://doi.org/10.1000/xyz123')).toBe(true);
      expect(validateDOI('bad-doi')).toBe(false);
    });
  });

  describe('Field Validation (validateField)', () => {

    test('Title validation', () => {
      const validRecord = { title: { en: 'Title', fr: 'Titre' } };
      const invalidRecord = { title: { en: 'Title', fr: '' } };

      expect(validateField(validRecord, 'title')).toBeTruthy();
      expect(validateField(invalidRecord, 'title')).toBeFalsy();
    });

    test('Keywords validation', () => {
      const valid = { keywords: { en: ['ocean'], fr: [] } };
      const invalid = { keywords: { en: [], fr: [] } };

      expect(validateField(valid, 'keywords')).toBeTruthy();
      expect(validateField(invalid, 'keywords')).toBeFalsy();
    });

    test('Spatial Map validation', () => {
      const validBox = {
        map: { north: "10", south: "1", east: "10", west: "1" },
        resourceType: "physical"
      };
      const invalidBox = {
        map: { north: "1", south: "10", east: "1", west: "10" }, // N < S
        resourceType: "physical"
      };

      expect(validateField(validBox, 'map')).toBe(true);
      expect(validateField(invalidBox, 'map')).toBe(false);
    });

    test('Spatial Map validation with Zero coordinates', () => {
      const validBoxWithZero = {
        map: { north: "10", south: "0", east: "10", west: "0" },
        resourceType: "physical"
      };
      // This fails if '0' is falsy in the validation logic (fixed bug)
      expect(validateField(validBoxWithZero, 'map')).toBe(true);
    });

    test('Spatial Map validation requires description for biota (ISO) datasets', () => {
      const biotaNoDesc = {
        map: { north: "", south: "", east: "", west: "" },
        resourceType: ["biota"],
      };
      expect(validateField(biotaNoDesc, 'map')).toBeFalsy();

      const biotaWithDesc = {
        map: { north: "", south: "", east: "", west: "", description: "Northwest Atlantic" },
        resourceType: ["biota"],
      };
      expect(validateField(biotaWithDesc, 'map')).toBeTruthy();
    });

    test('Spatial Map validation requires description for legacy biological datasets', () => {
      const biologicalNoDesc = {
        map: { north: "", south: "", east: "", west: "" },
        resourceType: ["biological"],
      };
      expect(validateField(biologicalNoDesc, 'map')).toBeFalsy();

      const biologicalWithDesc = {
        map: { north: "", south: "", east: "", west: "", description: "Northwest Atlantic" },
        resourceType: ["biological"],
      };
      expect(validateField(biologicalWithDesc, 'map')).toBeTruthy();
    });

    test('Contacts validation', () => {
      const validContacts = [
        {
          role: ['owner'],
          givenNames: 'John',
          lastName: 'Doe',
          indEmail: 'john@example.com',
          inCitation: true
        },
        {
          role: ['custodian'],
          orgName: 'Org',
          orgEmail: 'info@org.com',
          orgURL: 'https://org.com'
        }
      ];

      // Valid case: has owner, custodian, citation, and valid emails/urls
      expect(validateField({ contacts: validContacts }, 'contacts')).toBeTruthy();

      // Invalid: Missing Custodian
      const missingCustodian = [validContacts[0]];
      expect(validateField({ contacts: missingCustodian }, 'contacts')).toBeFalsy();

      // Invalid: Missing Owner
      // Note: We need a contact set that HAS custodian but NO owner to test this specific failure
      const custodianContact = validContacts[1];
      // custodianContact has role=['custodian'], no inCitation (undefined/false)
      const missingOwner = [custodianContact];
      expect(validateField({ contacts: missingOwner }, 'contacts')).toBeFalsy();

      // Invalid: Bad Email
      const badEmail = [
        { ...validContacts[0], indEmail: 'bad-email' },
        validContacts[1]
      ];
      expect(validateField({ contacts: badEmail }, 'contacts')).toBeFalsy();
    });
  });

});
