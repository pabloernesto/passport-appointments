export default class RedirectMW {
  constructor(url_map) {
    this.url_map = url_map;
  }

  // takes in a dictionary from urls to permanent redirect targets
  static async fromMap(url_map) {
    // TODO: ideally we would receive a file and read it
    return new RedirectMW(url_map);
  }

  async respond(req, res) {
    let clean_url = req.url.split('?')[0];
    const keys = Object.keys(this.url_map)
    if (keys.includes(clean_url)) {
      res.statusCode = 308;
      const target = this.url_map[clean_url];
      res.setHeader('Location', target);
      res.end();
      return true;
    }
    return false;
  }
}
