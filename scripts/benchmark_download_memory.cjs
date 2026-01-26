
const fs = require('fs');
const path = require('path');

// Configuration
const CHUNK_SIZE = 64 * 1024;
const TOTAL_SIZE = 200 * 1024 * 1024; // 200MB
const ITERATIONS = TOTAL_SIZE / CHUNK_SIZE;

function getMemoryUsage() {
    const mem = process.memoryUsage();
    return {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        external: Math.round(mem.external / 1024 / 1024),
        arrayBuffers: Math.round((mem.arrayBuffers || 0) / 1024 / 1024)
    };
}

function gc() {
    if (global.gc) {
        try { global.gc(); } catch(e){}
    }
}

async function benchmarkAccumulation() {
    console.log('\n--- Benchmarking In-Memory Accumulation ---');
    gc();
    const start = getMemoryUsage();
    console.log(`Start:`, start);

    const chunks = [];
    let receivedLength = 0;

    for (let i = 0; i < ITERATIONS; i++) {
        const chunk = new Uint8Array(CHUNK_SIZE);
        chunk.fill(1);
        chunks.push(chunk);
        receivedLength += chunk.length;
    }

    console.log(`Chunks allocated. Merging...`);
    const packData = new Uint8Array(receivedLength);
    packData.fill(1); // Force allocation

    const end = getMemoryUsage();
    console.log(`End:`, end);

    const diff = {
        rss: end.rss - start.rss,
        heapUsed: end.heapUsed - start.heapUsed,
        external: end.external - start.external
    };
    console.log(`Growth: RSS +${diff.rss}MB, Heap +${diff.heapUsed}MB, External +${diff.external}MB`);
    return diff.rss;
}

async function benchmarkStreaming() {
    console.log('\n--- Benchmarking Streaming to File ---');
    gc();
    const start = getMemoryUsage();
    console.log(`Start:`, start);

    const tempFile = path.join(__dirname, 'temp_bench_stream.dat');
    const writer = fs.createWriteStream(tempFile);

    for (let i = 0; i < ITERATIONS; i++) {
        const chunk = new Uint8Array(CHUNK_SIZE);
        chunk.fill(1);

        const canWrite = writer.write(chunk);
        if (!canWrite) {
            await new Promise(resolve => writer.once('drain', resolve));
        }
    }

    writer.end();
    await new Promise(resolve => writer.on('finish', resolve));

    const end = getMemoryUsage();
    console.log(`End:`, end);

    const diff = {
        rss: end.rss - start.rss,
        heapUsed: end.heapUsed - start.heapUsed,
        external: end.external - start.external
    };
    console.log(`Growth: RSS +${diff.rss}MB, Heap +${diff.heapUsed}MB, External +${diff.external}MB`);

    fs.unlinkSync(tempFile);
    return diff.rss;
}

async function run() {
    console.log('Running Memory Benchmark (200MB)');

    const accGrowth = await benchmarkAccumulation();
    const streamGrowth = await benchmarkStreaming();

    console.log('\n=== RESULTS ===');
    console.log(`Accumulation Growth (RSS): ~${accGrowth} MB`);
    console.log(`Streaming Growth (RSS):    ~${streamGrowth} MB`);
}

run();
