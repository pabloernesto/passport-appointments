import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pipeline } from 'node:stream';

const statics_path = "public";

const dir = await fs.opendir(statics_path);
const known_assets = (await listFiles(dir))
  .map(s => ({
    // rebase and URL-encode the path
    path: s,
    url: new URL(path.relative(dir.path, s), "file:").pathname
  }));

function match(req) {
  const { method, url } = req;
  if (method !== "GET") return false;
  const request_url = new URL(url, "file:").pathname;   // URL-encode the path
  return known_assets.some(asset => asset.url === request_url);
}

async function respond(req, res, db) {
  req.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');

  const request_url = new URL(req.url, "file:").pathname; // URL-encode the path
  const asset_path = known_assets.find(asset => asset.url === request_url)["path"];
  let f = await fs.open(asset_path);
  f.createReadStream(asset_path).pipe(res);
}

async function listFiles(dir) {
  let files = [];
  for await (const dirent of dir) {
    if (dirent.isFile()) {
      files.push(path.join(dir.path, dirent.name));
    } else if (dirent.isDirectory()) {
      const subdir = await fs.opendir(path.join(dir.path, dirent.name));
      files.splice(-1, 0, ...(await listFiles(subdir)));
    }
  }
  return files;
}

export default { match, respond }
