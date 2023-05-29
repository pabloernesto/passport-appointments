import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pipeline } from 'node:stream';

const statics_path = "public";

/* source: https://github.com/nginx/nginx/blob/master/conf/mime.types */
const mimetypes = {
  html: 'text/html',
  htm: 'text/html',
  shtml: 'text/html',
  css: 'text/css',
  xml: 'text/xml',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'application/javascript',
  atom: 'application/atom+xml',
  rss: 'application/rss+xml',
  mml: 'text/mathml',
  txt: 'text/plain',
  jad: 'text/vnd.sun.j2me.app-descriptor',
  wml: 'text/vnd.wap.wml',
  htc: 'text/x-component',
  avif: 'image/avif',
  png: 'image/png',
  svg: 'image/svg+xml',
  svgz: 'image/svg+xml',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  wbmp: 'image/vnd.wap.wbmp',
  webp: 'image/webp',
  ico: 'image/x-icon',
  jng: 'image/x-jng',
  bmp: 'image/x-ms-bmp',
  woff: 'font/woff',
  woff2: 'font/woff2',
  jar: 'application/java-archive',
  war: 'application/java-archive',
  ear: 'application/java-archive',
  json: 'application/json',
  hqx: 'application/mac-binhex40',
  doc: 'application/msword',
  pdf: 'application/pdf',
  ps: 'application/postscript',
  eps: 'application/postscript',
  ai: 'application/postscript',
  rtf: 'application/rtf',
  m3u8: 'application/vnd.apple.mpegurl',
  kml: 'application/vnd.google-earth.kml+xml',
  kmz: 'application/vnd.google-earth.kmz',
  xls: 'application/vnd.ms-excel',
  eot: 'application/vnd.ms-fontobject',
  ppt: 'application/vnd.ms-powerpoint',
  odg: 'application/vnd.oasis.opendocument.graphics',
  odp: 'application/vnd.oasis.opendocument.presentation',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odt: 'application/vnd.oasis.opendocument.text',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  wmlc: 'application/vnd.wap.wmlc',
  wasm: 'application/wasm',
  '7z': 'application/x-7z-compressed',
  cco: 'application/x-cocoa',
  jardiff: 'application/x-java-archive-diff',
  jnlp: 'application/x-java-jnlp-file',
  run: 'application/x-makeself',
  pl: 'application/x-perl',
  pm: 'application/x-perl',
  prc: 'application/x-pilot',
  pdb: 'application/x-pilot',
  rar: 'application/x-rar-compressed',
  rpm: 'application/x-redhat-package-manager',
  sea: 'application/x-sea',
  swf: 'application/x-shockwave-flash',
  sit: 'application/x-stuffit',
  tcl: 'application/x-tcl',
  tk: 'application/x-tcl',
  der: 'application/x-x509-ca-cert',
  pem: 'application/x-x509-ca-cert',
  crt: 'application/x-x509-ca-cert',
  xpi: 'application/x-xpinstall',
  xhtml: 'application/xhtml+xml',
  xspf: 'application/xspf+xml',
  zip: 'application/zip',
  msi: 'application/octet-stream',
  msp: 'application/octet-stream',
  msm: 'application/octet-stream',
  mid: 'audio/midi',
  midi: 'audio/midi',
  kar: 'audio/midi',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  m4a: 'audio/x-m4a',
  ra: 'audio/x-realaudio',
  '3gpp': 'video/3gpp',
  '3gp': 'video/3gpp',
  ts: 'video/mp2t',
  mp4: 'video/mp4',
  mpeg: 'video/mpeg',
  mpg: 'video/mpeg',
  mov: 'video/quicktime',
  webm: 'video/webm',
  flv: 'video/x-flv',
  m4v: 'video/x-m4v',
  mng: 'video/x-mng',
  asx: 'video/x-ms-asf',
  asf: 'video/x-ms-asf',
  wmv: 'video/x-ms-wmv',
  avi: 'video/x-msvideo'
}
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
  const request_url = new URL(req.url, "file:").pathname; // URL-encode the path
  const asset_path = known_assets.find(asset => asset.url === request_url)["path"];
  res.setHeader('Content-Type', mimetypes[path.extname(asset_path).slice(1)]);
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
