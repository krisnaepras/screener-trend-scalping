import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = 'static/logo.svg';
const androidRes = 'android/app/src/main/res';

const sizes = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 }
];

async function generate() {
    console.log('Generating Android Icons form ' + svgPath + '...');

    // Read input
    const svgBuffer = fs.readFileSync(svgPath);

    for (const s of sizes) {
        const outDir = path.join(androidRes, s.dir);
        if (!fs.existsSync(outDir)) {
            console.warn(`Directory not found: ${outDir}, skipping.`);
            continue;
        }

        // 1. ic_launcher.png
        await sharp(svgBuffer)
            .resize(s.size, s.size)
            .png()
            .toFile(path.join(outDir, 'ic_launcher.png'));

        // 2. ic_launcher_foreground.png (Same as launcher for now)
        await sharp(svgBuffer)
            .resize(s.size, s.size)
            .png()
            .toFile(path.join(outDir, 'ic_launcher_foreground.png'));

        // 3. ic_launcher_round.png (Circular mask)
        // Create a rounded image by composite
        const r = s.size / 2;
        const circleSvg = `<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`;
        const mask = Buffer.from(circleSvg);

        // Resize first
        const resized = await sharp(svgBuffer).resize(s.size, s.size).png().toBuffer();

        await sharp(resized)
            .composite([{
                input: mask,
                blend: 'dest-in'
            }])
            .png()
            .toFile(path.join(outDir, 'ic_launcher_round.png'));

        console.log(`Updated ${s.dir} (${s.size}px)`);
    }
    console.log('Done!');
}

generate().catch(console.error);
