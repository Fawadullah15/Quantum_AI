import fs from 'fs';
import path from 'path';
import countriesData from '../lib/data/countries.js';

const EARTH_RADIUS = 4.4;
const LINK_RADIUS = EARTH_RADIUS * 0.994;

function latLongToVector3(lat, lon, r) {
  const phi = (90.0 - lat) * (Math.PI / 180.0);
  const theta = (lon + 180.0) * (Math.PI / 180.0);
  return [
    -(r * Math.sin(phi) * Math.cos(theta)),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}

function dist3d(p1, p2) {
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2 + (p1[2] - p2[2]) ** 2);
}

const positions = [];
const distances = [];
const offsets = [];

const features = countriesData.features || [];

for (const feature of features) {
  const geom = feature.geometry || {};
  const gtype = geom.type;
  const coords = geom.coordinates || [];

  const rings = [];
  if (gtype === 'Polygon') {
    rings.push(...coords);
  } else if (gtype === 'MultiPolygon') {
    for (const p of coords) {
      rings.push(...p);
    }
  }

  for (const ring of rings) {
    if (ring.length < 2) continue;
    const ringOffset = Math.random();

    const simplified = [ring[0]];
    for (let i = 1; i < ring.length; i++) {
      const prev = simplified[simplified.length - 1];
      const curr = ring[i];
      const d = Math.abs(curr[0] - prev[0]) + Math.abs(curr[1] - prev[1]);
      if (d > 0.1 || i === ring.length - 1) {
        simplified.push(curr);
      }
    }

    let totalLen = 0.0;
    const pts = simplified.map((pt) => latLongToVector3(pt[1], pt[0], LINK_RADIUS));
    for (let i = 0; i < pts.length - 1; i++) {
      totalLen += dist3d(pts[i], pts[i + 1]);
    }

    let curDist = 0.0;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const segLen = dist3d(p1, p2);

      positions.push(
        Number(p1[0].toFixed(4)),
        Number(p1[1].toFixed(4)),
        Number(p1[2].toFixed(4)),
        Number(p2[0].toFixed(4)),
        Number(p2[1].toFixed(4)),
        Number(p2[2].toFixed(4))
      );
      const dNorm1 = curDist / Math.max(totalLen, 0.001);
      const dNorm2 = (curDist + segLen) / Math.max(totalLen, 0.001);
      distances.push(Number(dNorm1.toFixed(4)), Number(dNorm2.toFixed(4)));
      offsets.push(Number(ringOffset.toFixed(4)), Number(ringOffset.toFixed(4)));
      curDist += segLen;
    }
  }
}

const geoExport = {
  positions,
  distances,
  offsets,
};

fs.writeFileSync(
  path.resolve('lib/data/geo-borders.json'),
  JSON.stringify(geoExport),
  'utf-8'
);

console.log(`Precomputed ${positions.length / 6} line segments to lib/data/geo-borders.json`);
