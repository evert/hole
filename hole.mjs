// @ts-check
import { Server } from 'node:net';
import fs from 'node:fs/promises';

const server = new Server((socket) => {
  socket.on('data', (data) => {
    const input = data.toString().trim();
    if (input.includes('\t')) {
      const [path, query] = input.split('\t');
      handle(new GopherContext(path, socket, query));
    } else {
      handle(new GopherContext(input, socket));
    }
  });
});

const HOLE_PORT = +(process.env.HOLE_PORT ?? '7070');
const HOLE_HOST = process.env.HOLE_HOST ?? 'localhost';
server.listen(HOLE_PORT);

console.log(`Hole is opened on gopher://${HOLE_HOST}:${HOLE_PORT}`);

/**
 * @param {GopherContext} ctx
 */
async function handle(ctx) {

  if (ctx.query) {
    console.log(`${ctx.socket.remoteAddress} "${ctx.path}" "${ctx.query}"`);
  } else {
    console.log(`${ctx.socket.remoteAddress} "${ctx.path}"`);
  }
  banner(ctx);
  switch(ctx.path) {
    case '/':
      home(ctx);
      break;
    case '/friends':
      friends(ctx);
      break;
    case '/guestbook':
      await guestbook(ctx);
      break;
    default:
      ctx.error('Page not found!');
      ctx.directory('Go back to home', '/');
      break;
  }
  ctx.socket.end();

}

/**
 * @param {GopherContext} ctx
 */
function home(ctx) {
  ctx.text(`# Home

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

  ctx.text('');
  ctx.search('Sign my guestbook', '/guestbook');
  ctx.directory('View my guestbook', '/guestbook');
  ctx.text('');
  ctx.link('My website', 'https://evertpot.com/');
  ctx.link('My mastodon', 'https://indieweb.social/evert');
  ctx.link('Link to source on Github', 'https://github.com/evert/hole');

}

/**
 * @param {GopherContext} ctx
 */
function banner(ctx) {

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
            |_|`);

}

/**
 * @param {GopherContext} ctx
 */
function friends(ctx) {

  ctx.text(`# Friends with holes

Sadly I don't have any friends yet that I can link to. Here's hoping
this changes in the future!`);

  ctx.directory('Go back to home', '/');

}

/**
 * @param {GopherContext} ctx
 */
async function guestbook(ctx) {

  if (ctx.query) {
    ctx.text(`Thanks for signing my guestbook, "${ctx.query}"!`);
    await fs.appendFile('guestbook.txt', `${new Date().toISOString()} - ${ctx.query}\n`);
  }

  ctx.text('');
  ctx.text(`# Guestbook\n`);
  ctx.text(await fs.readFile('guestbook.txt', 'utf-8').catch(() => 'No entries yet! Sign the guestbook to be the first one!'));

  ctx.text('');
  if (!ctx.query) ctx.search('Sign my guestbook', '/guestbook');

  ctx.directory('Go back to home', '/');

}

class GopherContext {

  /**
   * @param {string} path
   * @param {import('net').Socket} socket
   * @param {string|null} query
   */
  constructor(path, socket, query = null) {
    // Our server adds a / to every path
    this.path = path[0] === '/' ? path : '/' + path;
    this.socket = socket;
    this.query = query;
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
    return this.line('7', display, path, HOLE_HOST, HOLE_PORT);
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


