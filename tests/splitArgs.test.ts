import { splitArgs } from '../src/utils/splitArgs';

describe('splitArgs', () => {
    it('should split double quoted string', () => {
        var input = ` I  said 'I am sorry.', and he said "it doesn't matter." `;
        var result = splitArgs(input);
        expect(7).toBe(result.length);
        expect(result[0]).toBe('I');
        expect(result[1]).toBe('said');
        expect(result[2]).toBe('I am sorry.,');
        expect(result[3]).toBe('and');
        expect(result[4]).toBe('he');
        expect(result[5]).toBe('said');
        expect(result[6]).toBe(`it doesn't matter.`);
    });

    it('should split pure double quoted string', function () {
        var input = `I said "I am sorry.", and he said "it doesn't matter."`;
        var result = splitArgs(input);
        expect(result.length).toBe(7);
        expect(result[0]).toBe("I");
        expect(result[1]).toBe("said");
        expect(result[2]).toBe("I am sorry.,");
        expect(result[3]).toBe("and");
        expect(result[4]).toBe("he");
        expect(result[5]).toBe("said");
        expect(result[6]).toBe("it doesn't matter.");
    });

    it('should split single quoted string', function () {
        var input = `I said "I am sorry.", and he said "it doesn't matter."`;
        var result = splitArgs(input);
        expect(result.length).toBe(7);
        expect(result[0]).toBe("I");
        expect(result[1]).toBe("said");
        expect(result[2]).toBe("I am sorry.,");
        expect(result[3]).toBe("and");
        expect(result[4]).toBe("he");
        expect(result[5]).toBe("said");
        expect(result[6]).toBe("it doesn't matter.");
    });

    it('should split pure single quoted string', function () {
        var input = `I said 'I am sorry.', and he said "it doesn't matter."`;
        var result = splitArgs(input);
        expect(result.length).toBe(7);
        expect(result[0]).toBe("I");
        expect(result[1]).toBe("said");
        expect(result[2]).toBe("I am sorry.,");
        expect(result[3]).toBe("and");
        expect(result[4]).toBe("he");
        expect(result[5]).toBe("said");
        expect(result[6]).toBe("it doesn't matter.");
    });

    it('should split to 4 empty strings', function () {
        var input = ',,,';
        var result = splitArgs(input, /,/, true);
        expect(result.length).toBe(4);
    })
});
