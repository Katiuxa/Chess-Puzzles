"use strict";

const fs = require("fs");
const path = require("path");
const { Resvg } = require("@resvg/resvg-js");

const ROOT = path.join(__dirname, "..");
const RES = path.join(ROOT, "resources");
const STORE = path.join(ROOT, "store-assets");
const ICON_SVG = fs.readFileSync(path.join(ROOT, "public", "favicon.svg"), "utf8");

function pngFromSvg(svg, width) {
  return new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
}

function write(file, buf) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, buf);
  console.log(path.relative(ROOT, file));
}

function iconAt(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${ICON_SVG.replace(/<svg[^>]*>/, "").replace("</svg>", "")}</svg>`;
  return pngFromSvg(svg, size);
}

function splash(w, h) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0e1a12"/>
    <g transform="translate(${w / 2 - 160} ${h / 2 - 210}) scale(5)">
      ${ICON_SVG.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
    </g>
    <text x="${w / 2}" y="${h / 2 + 220}" text-anchor="middle" fill="#e0c36a" font-family="sans-serif" font-size="52" font-weight="700">CHESS PUZZLES</text>
  </svg>`;
  return pngFromSvg(svg, w);
}

function featureGraphic() {
  const w = 1024, h = 500;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#0e1a12"/>
    <rect x="70" y="90" width="220" height="220" fill="#f0d9b5"/>
    <rect x="180" y="90" width="110" height="110" fill="#b58863"/>
    <rect x="70" y="200" width="110" height="110" fill="#b58863"/>
    <g transform="translate(90 118) scale(3.2)">
      ${ICON_SVG.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
    </g>
    <text x="420" y="230" fill="#f6efe2" font-family="sans-serif" font-size="56" font-weight="700">Chess Puzzles</text>
    <text x="422" y="290" fill="#e0c36a" font-family="sans-serif" font-size="28">Compositions by Sherzod</text>
  </svg>`;
  return pngFromSvg(svg, w);
}

function main() {
  write(path.join(RES, "icon.png"), iconAt(1024));
  write(path.join(RES, "icon-foreground.png"), iconAt(1024));
  write(path.join(RES, "splash.png"), splash(1242, 2436));
  write(path.join(STORE, "icon-512.png"), iconAt(512));
  write(path.join(STORE, "feature-graphic.png"), featureGraphic());
}

main();
