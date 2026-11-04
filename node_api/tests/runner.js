// Test runner minimalista, sin dependencias externas.
// Uso: node tests/runner.js [unit] [integration] [e2e]  (sin args = todas las carpetas)

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SUITES = ['unit', 'integration', 'e2e'];

const requested = process.argv.slice(2).filter(a => SUITES.includes(a));
const suitesToRun = requested.length ? requested : SUITES;

function findTestFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== 'helpers' && entry.name !== 'node_modules') {
            out.push(...findTestFiles(full));
        } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
            out.push(full);
        }
    }
    return out;
}

// --- API estilo describe/it con hooks before/after por bloque ---
const rootBlocks = [];
let currentBlock = null;

function describe(name, fn) {
    const block = { name, parent: currentBlock, tests: [], befores: [], afters: [], children: [] };
    if (currentBlock) currentBlock.children.push(block);
    else rootBlocks.push(block);
    const prev = currentBlock;
    currentBlock = block;
    fn();
    currentBlock = prev;
}

function it(name, fn) {
    if (!currentBlock) throw new Error(`it("${name}") debe estar dentro de un describe()`);
    currentBlock.tests.push({ name, fn });
}

function before(fn) {
    if (!currentBlock) throw new Error('before() debe estar dentro de un describe()');
    currentBlock.befores.push(fn);
}

function after(fn) {
    if (!currentBlock) throw new Error('after() debe estar dentro de un describe()');
    currentBlock.afters.push(fn);
}

// Asserts mínimos sobre el módulo nativo `assert` (sin dependencias nuevas)
const nodeAssert = require('assert');
const expect = (actual) => ({
    toBe(expected) { nodeAssert.strictEqual(actual, expected); },
    toEqual(expected) { nodeAssert.deepStrictEqual(actual, expected); },
    toBeTruthy() { nodeAssert.ok(actual); },
    toBeFalsy() { nodeAssert.ok(!actual); },
    toContain(expected) { nodeAssert.ok(actual.includes(expected)); },
    toThrow() {
        nodeAssert.throws(actual);
    },
    async toRejects() {
        await nodeAssert.rejects(actual);
    }
});

global.describe = describe;
global.it = it;
global.before = before;
global.after = after;
global.expect = expect;
global.assert = nodeAssert;

async function runBlock(block, prefix, stats) {
    for (const b of block.befores) await b();
    for (const t of block.tests) {
        const fullName = `${prefix}${block.name} > ${t.name}`;
        try {
            await t.fn();
            stats.passed++;
            console.log(`  ✅ ${fullName}`);
        } catch (err) {
            stats.failed++;
            stats.failures.push({ name: fullName, err });
            console.log(`  ❌ ${fullName}`);
            console.log(`     ${err.message}`);
        }
    }
    for (const child of block.children) {
        await runBlock(child, `${prefix}${block.name} > `, stats);
    }
    for (const a of block.afters) await a();
}

async function main() {
    const stats = { passed: 0, failed: 0, failures: [] };

    for (const suite of suitesToRun) {
        const dir = path.join(ROOT, suite);
        const files = findTestFiles(dir);
        if (!files.length) continue;

        console.log(`\n=== Suite: ${suite} (${files.length} archivo/s) ===`);
        for (const file of files) {
            rootBlocks.length = 0;
            delete require.cache[file];
            require(file);
            for (const block of rootBlocks) {
                await runBlock(block, '', stats);
            }
        }
    }

    console.log(`\n--- Resultado: ${stats.passed} OK, ${stats.failed} fallidos ---`);
    process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error('Error fatal en el runner de tests:', err);
    process.exit(1);
});
