import { generateRandomDoiSuffix } from '../utils/convertToDataCite';

describe('generateRandomDoiSuffix', () => {
    test('produces XXXX-XXXX format with allowed charset', () => {
        const allowedRe = /^[a-hjkmnpqrstuvwxyz0-9]{4}-[a-hjkmnpqrstuvwxyz0-9]{4}$/;
        for (let i = 0; i < 100; i += 1) {
            const s = generateRandomDoiSuffix();
            expect(typeof s).toBe('string');
            expect(s.length).toBe(9); // 8 chars + 1 hyphen
            expect(allowedRe.test(s)).toBe(true);
            expect(s).toBe(s.toLowerCase());
            expect(s.includes('i')).toBe(false);
            expect(s.includes('l')).toBe(false);
            expect(s.includes('o')).toBe(false);
        }
    });
});
