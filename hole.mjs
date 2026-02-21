// @ts-check
import { Server } from 'node:net';

const server = new Server((socket) => {
  socket.on('data', (data) => {
    const input = data.toString().trim();
    console.log(input);
    handle(new GopherContext(input, socket));
    socket.end();
  });
});

const HOLE_PORT = 7070;
const HOLE_HOST = process.env.HOLE_HOST ?? 'localhost';
server.listen(HOLE_PORT);

console.log(`Hole is opened on gopher://${HOLE_HOST}:${HOLE_PORT}`);

/**
 * @param {GopherContext} ctx
 */
function handle(ctx) {

  ctx.text(` _____                _   _
| ____|_   _____ _ __| |_( )___
|  _| \\ \\ / / _ \\ '__| __|// __|
| |___ \\ V /  __/ |  | |_  \\__ \\
|_____| \\_/ \\___|_|   \\__| |___/

  ____             _                 _   _       _
 / ___| ___  _ __ | |__   ___ _ __  | | | | ___ | | ___
| |  _ / _ \\| '_ \\| '_ \\ / _ \\ '__| | |_| |/ _ \\| |/ _ \\
| |_| | (_) | |_) | | | |  __/ |    |  _  | (_) | |  __/
 \\____|\\___/| .__/|_| |_|\\___|_|    |_| |_|\\___/|_|\\___|
            |_|

Welcome to my hole! Yes, 'hole' really is the word people use for a
site on the gopher protocol. I've had a Gopher site on and off for a
few times, but it's finally time to have a more permanent spot on the
smolweb.

This space is pretty empty right now, but I hope to fill it with a bit
more content over time.

Menu:`);
  ctx.directory('About me', '/about');
  ctx.directory('Projects', '/projects');
  ctx.directory('Friends with holes', '/friends');
  ctx.directory('My projects', '/projects');

  ctx.text('');
  ctx.link('My website', 'https://evertpot.com/');
  ctx.link('My mastodon', 'https://indieweb.social/evert');
  ctx.link('Link to source on Github', 'https://github.com/evert/hole');


}

class GopherContext {

  /**
   * @param {string} path
   * @param {import('net').Socket} socket
   */
  constructor(path, socket) {
    this.path = path;
    this.socket = socket;
  }

  /**
   * Informational line. Will auto-split on newlines and long lines.
   *
   * @param {string} txt
   */
  text(txt) {
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

    return this.line('1', display, path, host??HOLE_HOST, port??HOLE_PORT);

  }

  /**
   * Links to an external URL.
   *
   * @param {string} display
   * @param {string} url
   */
  link(display, url) {
    
    return this.line('h', display, 'URL:' + url);
  
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


