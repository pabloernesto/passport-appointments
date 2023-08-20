import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pipeline } from 'node:stream';

const statics_path = "public";

export default class StaticFilesMW {
  constructor(path, asset_list) {
    this._statics_path = path;
    this._known_assets = asset_list;
  }

  async respond(req, res) {
    if (req.method !== "GET") return false;

    const request_url = new URL(req.url, "file:").pathname; // URL-encode the path
    const asset_path = getAssetByURL(request_url, this._known_assets)?.["path"];
    if (asset_path === undefined) return false; // no such resource

    res.statusCode = 200;
    res.setHeader('Content-Type', mimetypes[path.extname(asset_path).slice(1)]);
    let f = await fs.open(asset_path);
    f.createReadStream(asset_path).pipe(res);
    return true;
  }

  static async fromPath(_path) {
    const dir = await fs.opendir(_path);
    const asset_list = (await listFiles(dir)).map(s => ({
      // rebase and URL-encode the path
      path: s,
      url: new URL(path.relative(dir.path, s), "file:").pathname
    }));
    return new StaticFilesMW(_path, asset_list);
  }
}

/* source: https://github.com/nginx/nginx/blob/master/conf/mime.types */
let mimetypes;
try {
  const mimestr = await fs.readFile('./app/lib/http/mimetypes.json', { encoding: 'utf8' });
  mimetypes = JSON.parse(mimestr);
} catch (err) {
  throw new Error('Could not read MIME type descriptions.', { cause: err });
}

function getAssetByURL(url, assets) {
  const cleanURL = url.split('?')[0]; // Remove query string from URL
  const urlWithoutExt = cleanURL.replace(/\.[^/.]+$/, ""); // Remove file extension from URL

  return assets.find((asset) => {
    const assetWithoutExt = asset.url.replace(/\.[^/.]+$/, "");
    return assetWithoutExt === urlWithoutExt;
  });
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
