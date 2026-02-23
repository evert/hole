// @ts-check
import { Server } from 'node:net';

/**
 * GopherContext holds all informationa bout a single gopher request
 */
export class GopherContext {

  /**
   * @param {GopherServer} server
   * @param {string} path
   * @param {import('net').Socket} socket
   * @param {string|null} query
   */
  constructor(server, path, socket, query = null) {
    // Our server adds a / to every path
    this.server = server;
    this.path = path[0] === '/' ? path : '/' + path;
    this.socket = socket;
    this.query = query;

  }


  /**
   * Informational line. Will auto-split on newlines and long lines.
   *
   * @param {string} txt
   */
  info(txt) {
    let r = '';
    for(let l of txt.split('\n')) {

      while(l.length > 70) {
        r += this.line('i', l.slice(0, 70));
        l = l.slice(70);
      }
      r += this.line('i', l);
    }
    return r;
  }

  /**
   * Title or header line.
   *
   * This is just an info line annotated as a title. Not sure if there's clients
   * that support this, but it's taken from 'Gopher-II' draft.
   *
   * Normally these will just show up as a standard info line.
   *
   * @param {string} txt
   */
  title(txt) {
    return this.line('i', txt, 'TITLE');
  }

  /**
   * Links to a different gopher menu/directory.
   *
   * Omit host and port for a local link
   *
   * @param {string} display
   * @param {string} path
   * @param {string|null} host
   * @param {number|null} port
   */
  directory(display, path, host = null, port = null) {

    return this.line(
      '1',
      display,
      path,
      host??this.server.host,
      port??this.server.port
    );

  }

  /**
   * Links to an external URL.
   *
   * @param {string} display
   * @param {string} url
   */
  link(display, url) {

    const urlObj = new URL(url);
    if (urlObj.protocol === 'gopher:') {
      const type = urlObj.pathname.length >= 2 ? urlObj.pathname[1] : '1';
      return this.line(
        type,
        display,
        urlObj.pathname.slice(2),
        urlObj.hostname,
        +(urlObj.port || '70')
      );
    } else {
      return this.line('h', display, 'URL:' + url);
    }

  }

  /**
   * Error line
   *
   * @param {string} txt
   */
  error(txt) {
    return this.line('3', txt);
  }

  /**
   * Search form
   *
   * @param {string} display
   * @param {string} path
   */
  search(display, path) {
    return this.line(
      '7',
      display,
      path,
      this.server.host,
      this.server.port
    );

  }

  /**
   * Generic line writer
   *
   * @param {string} char
   * @param {string} display
   * @param {string|null} path
   * @param {string|null} host
   * @param {number|null} port
   */
  line(char, display, path = null, host = null, port = null) {

    this.socket.write([char + display, path??'', host??'host.invalid', port??0].join('\t') + '\r\n');

  }

}

export class GopherServer {
  
  /**
   * @param {number} port
   * @param {string} host
   */
  constructor(host, port) {
    this.port = port;
    this.host = host;
    this.routes = [];
  }

  start() {

    this.server = new Server((socket) => {
      socket.on('data', (data) => {
        const input = data.toString().trim();
        if (input.includes('\t')) {
          const [path, query] = input.split('\t');
          this.handle(new GopherContext(this, path, socket, query));
        } else {
          this.handle(new GopherContext(this, input, socket));
        }
      });

      socket.on("error", (/** @type {NodeJS.ErrnoException} */ err) => {
        if (err && (err.code === "ECONNRESET" || err.code === "EPIPE")) {
          // Expected: client hung up rudely or we wrote to a dead socket.
          // Don’t crash; usually don’t spam logs.
          return;
        }

        // Unexpected errors: log with some context
        console.warn("Socket error:", {
          code: err?.code,
          message: err?.message,
          remote: `${socket.remoteAddress}:${socket.remotePort}`,
        });
      });

    });
    this.server.listen(this.port);

  }

  /**
   * Define a route handler for a specific path.
   *
   * @param {string} path
   * @param {(ctx: GopherContext) => void|Promise<void>} handler
   */
  route(path, handler) {
    this.routes.push([path, handler]);
  }

  /**
   * @param {GopherContext} ctx
   */
  async handle(ctx) {

    try {

      if (ctx.query) {
        console.log(`${ctx.socket.remoteAddress} "${ctx.path}" "${ctx.query}"`);
      } else {
        console.log(`${ctx.socket.remoteAddress} "${ctx.path}"`);
      }
      for(const [path, handler] of this.routes) {
        if (ctx.path === path) {
          await handler(ctx);
          return;
        }
      }

      ctx.error('Page not found!');
      ctx.directory('Go back to home', '/');

    } finally {

      ctx.socket.end();

    }

  }

}
