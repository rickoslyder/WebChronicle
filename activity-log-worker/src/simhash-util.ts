// Vendorized code from simhash-js (MIT License)
// Original: https://github.com/vkandy/simhash-js

// --- Jenkins.js content ---
class JenkinsInternal {
    pc: number = 0;
    pb: number = 0;

    // Implementation of lookup3 algorithm
    private lookup3(k: string, pc: number, pb: number): { c: number, b: number } {
        let length = k.length;
        let a: number, b: number, c: number;

        a = b = c = 0xdeadbeef + length + pc;
        c += pb;

        let offset = 0;
        while (length > 12) {
            a += k.charCodeAt(offset + 0);
            a += k.charCodeAt(offset + 1) << 8;
            a += k.charCodeAt(offset + 2) << 16;
            a += k.charCodeAt(offset + 3) << 24;

            b += k.charCodeAt(offset + 4);
            b += k.charCodeAt(offset + 5) << 8;
            b += k.charCodeAt(offset + 6) << 16;
            b += k.charCodeAt(offset + 7) << 24;

            c += k.charCodeAt(offset + 8);
            c += k.charCodeAt(offset + 9) << 8;
            c += k.charCodeAt(offset + 10) << 16;
            c += k.charCodeAt(offset + 11) << 24;

            const mixed = this.mix(a, b, c);
            a = mixed.a;
            b = mixed.b;
            c = mixed.c;

            length -= 12;
            offset += 12;
        }

        switch (length) { // Handle remaining bytes
            case 12: c += k.charCodeAt(offset + 11) << 24; // Fall through
            case 11: c += k.charCodeAt(offset + 10) << 16; // Fall through
            case 10: c += k.charCodeAt(offset + 9) << 8;    // Fall through
            case 9: c += k.charCodeAt(offset + 8);       // Fall through
            case 8: b += k.charCodeAt(offset + 7) << 24; // Fall through
            case 7: b += k.charCodeAt(offset + 6) << 16; // Fall through
            case 6: b += k.charCodeAt(offset + 5) << 8;  // Fall through
            case 5: b += k.charCodeAt(offset + 4);       // Fall through
            case 4: a += k.charCodeAt(offset + 3) << 24; // Fall through
            case 3: a += k.charCodeAt(offset + 2) << 16; // Fall through
            case 2: a += k.charCodeAt(offset + 1) << 8;  // Fall through
            case 1: a += k.charCodeAt(offset + 0);       // Fall through
                break;
            case 0: return { c: c >>> 0, b: b >>> 0 };
        }

        const finalMixed = this.finalMix(a, b, c);
        a = finalMixed.a;
        b = finalMixed.b;
        c = finalMixed.c;

        return { c: c >>> 0, b: b >>> 0 };
    }

    // Mixes 3 32-bit integers reversibly but fast
    private mix(a: number, b: number, c: number): { a: number, b: number, c: number } {
        a -= c; a ^= this.rot(c, 4); c += b;
        b -= a; b ^= this.rot(a, 6); a += c;
        c -= b; c ^= this.rot(b, 8); b += a;
        a -= c; a ^= this.rot(c, 16); c += b;
        b -= a; b ^= this.rot(a, 19); a += c;
        c -= b; c ^= this.rot(b, 4); b += a;
        return { a: a, b: b, c: c };
    }

    // Final mixing of 3 32-bit values (a,b,c) into c
    private finalMix(a: number, b: number, c: number): { a: number, b: number, c: number } {
        c ^= b; c -= this.rot(b, 14);
        a ^= c; a -= this.rot(c, 11);
        b ^= a; b -= this.rot(a, 25);
        c ^= b; c -= this.rot(b, 16);
        a ^= c; a -= this.rot(c, 4);
        b ^= a; b -= this.rot(a, 14);
        c ^= b; c -= this.rot(b, 24);
        return { a: a, b: b, c: c };
    }

    // Rotate x by k distance
    private rot(x: number, k: number): number {
        return (((x) << (k)) | ((x) >>> (32 - (k))));
    }

    // Public hash function
    public hash32(msg: string): number {
        const h = this.lookup3(msg, this.pc, this.pb);
        return h.c; // Return the number directly
    }
}

// --- SimHash.js content ---
interface SimHashOptions {
    kshingles?: number;
    maxFeatures?: number;
}

export class SimHash {
    private kshingles: number;
    private maxFeatures: number;
    private jenkins: JenkinsInternal;

    constructor(options?: SimHashOptions) {
        this.kshingles = options?.kshingles ?? 4;
        this.maxFeatures = options?.maxFeatures ?? 128;
        this.jenkins = new JenkinsInternal(); // Use the internal Jenkins class
    }

    // Tokenizes input into 'kshingles' number of tokens.
    private tokenize(original: string): string[] {
        const size = original.length;
        if (size <= this.kshingles) {
            return [original];
        }
        const shingles: string[] = [];
        for (let i = 0; i < size; i = i + this.kshingles) {
            shingles.push(i + this.kshingles < size ? original.slice(i, i + this.kshingles) : original.slice(i));
        }
        return shingles;
    }

    // Combine shingles
    private combineShingles(shingles: number[]): number {
        if (shingles.length === 0) return 0; // Return 0 for empty input
        if (shingles.length === 1) return shingles[0];

        // Sort and keep top N features (hashes)
        shingles.sort((a, b) => a - b); // Simple number sort
        if (shingles.length > this.maxFeatures) {
            shingles = shingles.slice(0, this.maxFeatures); // Keep the smallest hashes
        }

        let simhash = 0;
        for (let pos = 0; pos < 32; pos++) {
            let weight = 0;
            const mask = 1 << pos;
            for (const shingle of shingles) {
                 // Check if the bit at pos is set
                weight += (shingle & mask) !== 0 ? 1 : -1;
            }
            if (weight > 0) {
                simhash |= mask; // Set the bit if weight is positive
            }
        }
        return simhash >>> 0; // Ensure unsigned 32-bit integer
    }

    // Driver function.
    public hash(input: string): number { // Returns a 32-bit unsigned number
        const tokens = this.tokenize(input);
        const shingles: number[] = tokens.map(token => this.jenkins.hash32(token));
        const combinedHash = this.combineShingles(shingles);
        return combinedHash;
    }
}

// --- Comparator.js content ---
export class Comparator {
    // Calculates binary hamming distance of two base 16 integers (strings).
    static hammingDistance(x: string, y: string): number {
        // Note: The original library's implementation here seems overly complex
        // and possibly incorrect for standard Hamming distance on hex strings representing ints.
        // Let's use a simpler, standard approach for comparing the 32-bit numbers represented by the hex strings.
        try {
            const n1 = parseInt(x, 16);
            const n2 = parseInt(y, 16);

            if (isNaN(n1) || isNaN(n2)) {
                console.error("Invalid hex string for Hamming distance:", x, y);
                return 32; // Max distance for 32 bits on error
            }

            let xorResult = n1 ^ n2;
            let distance = 0;
            while (xorResult > 0) {
                distance++;
                xorResult &= (xorResult - 1); // Clear the least significant set bit
            }
            return distance;
        } catch (e) {
             console.error("Error calculating Hamming distance:", e);
             return 32; // Max distance on error
        }
    }

    // Calculates bit-wise similarity - Jaccard index (on hex strings).
    static similarity(x: string, y: string): number {
         try {
            const n1 = parseInt(x, 16);
            const n2 = parseInt(y, 16);
            if (isNaN(n1) || isNaN(n2)) return 0;

            const intersection = n1 & n2;
            const union = n1 | n2;

            const intersectionWeight = this.hammingWeight(intersection);
            const unionWeight = this.hammingWeight(union);

            return unionWeight === 0 ? 1 : intersectionWeight / unionWeight; // Avoid division by zero
         } catch(e) {
            return 0;
         }
    }

    // Calculates Hamming weight (population count) of a number.
    static hammingWeight(n: number): number {
        let count = 0;
        while (n > 0) {
            n &= (n - 1); // Clear the least significant set bit
            count++;
        }
        return count;
    }
}

