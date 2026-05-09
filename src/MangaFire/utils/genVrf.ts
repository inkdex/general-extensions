export default async function genVrf(input: string) {
  const script = `
        const RC4_KEYS = {
            l: "u8cBwTi1CM4XE3BkwG5Ble3AxWgnhKiXD9Cr279yNW0=",
            g: "t00NOJ/Fl3wZtez1xU6/YvcWDoXzjrDHJLL2r/IWgcY=",
            B: "S7I+968ZY4Fo3sLVNH/ExCNq7gjuOHjSRgSqh6SsPJc=",
            m: "7D4Q8i8dApRj6UWxXbIBEa1UqvjI+8W0UvPH9talJK8=",
            F: "0JsmfWZA1kwZeWLk5gfV5g41lwLL72wHbam5ZPfnOVE=",
        };

        const SEEDS32 = {
            A: "pGjzSCtS4izckNAOhrY5unJnO2E1VbrU+tXRYG24vTo=",
            V: "dFcKX9Qpu7mt/AD6mb1QF4w+KqHTKmdiqp7penubAKI=",
            N: "owp1QIY/kBiRWrRn9TLN2CdZsLeejzHhfJwdiQMjg3w=",
            P: "H1XbRvXOvZAhyyPaO68vgIUgdAHn68Y6mrwkpIpEue8=",
            k: "2Nmobf/mpQ7+Dxq1/olPSDj3xV8PZkPbKaucJvVckL0=",
        };

        const PREFIX_KEYS = {
            O: "Rowe+rg/0g==",
            v: "8cULcnOMJVY8AA==",
            L: "n2+Og2Gth8Hh",
            p: "aRpvzH+yoA==",
            W: "ZB4oBi0=",
        };

        function toBytes(str) {
            return Array.from(str, (c) => c.charCodeAt(0) & 0xff);
        }

        function fromBytes(bytes) {
            return bytes.map((b) => String.fromCharCode(b & 0xff)).join("");
        }

        function rc4Bytes(key, input) {
            const s = Array.from({ length: 256 }, (_, i) => i);
            let j = 0;

            // KSA
            for (let i = 0; i < 256; i++) {
                j = (j + s[i] + key.charCodeAt(i % key.length)) & 0xff;
                [s[i], s[j]] = [s[j], s[i]];
            }

            // PRGA
            const out = new Array(input.length);
            let i = 0;
            j = 0;
            for (let y = 0; y < input.length; y++) {
                i = (i + 1) & 0xff;
                j = (j + s[i]) & 0xff;
                [s[i], s[j]] = [s[j], s[i]];
                const k = s[(s[i] + s[j]) & 0xff];
                out[y] = (input[y] ^ k) & 0xff;
            }
            return out;
        }

        function transform(
            input,
            initSeedBytes,
            prefixKeyString,
            prefixLen,
            schedule,
        ) {
            const out = [];
            for (let i = 0; i < input.length; i++) {
                if (i < prefixLen) out.push(prefixKeyString.charCodeAt(i) & 0xff);

                out.push(
                    schedule[i % 10]((input[i] ^ initSeedBytes[i % 32]) & 0xff) & 0xff,
                );
            }
            return out;
        }

        // 8-bit ops
        const add8 = (n) => (c) => (c + n) & 0xff;
        const sub8 = (n) => (c) => (c - n + 256) & 0xff;
        const xor8 = (n) => (c) => (c ^ n) & 0xff;
        const rotl8 = (n) => (c) => ((c << n) | (c >>> (8 - n))) & 0xff;

        // Schedules for each step (10 ops each, indexed by i % 10)
        const scheduleC = [
            sub8(48),
            sub8(19),
            xor8(241),
            sub8(19),
            add8(223),
            sub8(19),
            sub8(170),
            sub8(19),
            sub8(48),
            xor8(8),
        ];

        const scheduleY = [
            rotl8(4),
            add8(223),
            rotl8(4),
            xor8(163),
            sub8(48),
            add8(82),
            add8(223),
            sub8(48),
            xor8(83),
            rotl8(4),
        ];

        const scheduleB = [
            sub8(19),
            add8(82),
            sub8(48),
            sub8(170),
            rotl8(4),
            sub8(48),
            sub8(170),
            xor8(8),
            add8(82),
            xor8(163),
        ];

        const scheduleJ = [
            add8(223),
            rotl8(4),
            add8(223),
            xor8(83),
            sub8(19),
            add8(223),
            sub8(170),
            add8(223),
            sub8(170),
            xor8(83),
        ];

        const scheduleE = [
            add8(82),
            xor8(83),
            xor8(163),
            add8(82),
            sub8(170),
            xor8(8),
            xor8(241),
            add8(82),
            add8(176),
            rotl8(4),
        ];

        function base64UrlEncodeBytes(bytes) {
            const std = btoa(fromBytes(bytes));
            return std
                .replaceAll("+", "-")
                .replaceAll("/", "_")
                .replace(/=+$/, "");
        }

        function bytesFromBase64(b64) {
            return toBytes(atob(b64));
        }

        // Stage 0: normalize to URI-encoded bytes
        let bytes = toBytes(encodeURIComponent("${input}"));

        // RC4 1
        bytes = rc4Bytes(atob(RC4_KEYS.l), bytes);

        // Step C1
        bytes = transform(
            bytes,
            bytesFromBase64(SEEDS32.A),
            atob(PREFIX_KEYS.O),
            7,
            scheduleC,
        );

        // RC4 2
        bytes = rc4Bytes(atob(RC4_KEYS.g), bytes);

        // Step Y
        bytes = transform(
            bytes,
            bytesFromBase64(SEEDS32.V),
            atob(PREFIX_KEYS.v),
            10,
            scheduleY,
        );

        // RC4 3
        bytes = rc4Bytes(atob(RC4_KEYS.B), bytes);

        // Step B
        bytes = transform(
            bytes,
            bytesFromBase64(SEEDS32.N),
            atob(PREFIX_KEYS.L),
            9,
            scheduleB,
        );

        // RC4 4
        bytes = rc4Bytes(atob(RC4_KEYS.m), bytes);

        // Step J
        bytes = transform(
            bytes,
            bytesFromBase64(SEEDS32.P),
            atob(PREFIX_KEYS.p),
            7,
            scheduleJ,
        );

        // RC4 5
        bytes = rc4Bytes(atob(RC4_KEYS.F), bytes);

        // Step E
        bytes = transform(
            bytes,
            bytesFromBase64(SEEDS32.k),
            atob(PREFIX_KEYS.W),
            5,
            scheduleE,
        );

        // Base64URL
        return base64UrlEncodeBytes(bytes);
    `;

  const webViewResult = await Application.executeInWebView({
    source: {
      html: "<html></html>",
      baseUrl: "http://127.0.0.1",
      loadCSS: false,
      loadImages: false,
    },
    inject: script,
    storage: { cookies: [] },
  });
  return webViewResult.result as string;
}
