// @ts-check
import fs from 'node:fs/promises';
import { GopherContext, GopherServer } from './server.mjs';

const server = new GopherServer(
  process.env.HOLE_HOST ?? 'localhost',
  +(process.env.HOLE_PORT ?? '7070'),
);
server.start();
console.log(`Hole is opened on gopher://${server.host}:${server.port}/`);

const logos = {
  main: await fs.readFile('./logos/main.txt', 'utf-8'),
  burrow: await fs.readFile('./logos/burrow.txt', 'utf-8'),
};

/**
 * @param {GopherContext} ctx
 */
async function banner(ctx, logo = 'main') {

  ctx.info(logos[logo]);
  ctx.info('');

}

server.route('/', ctx => {

  banner(ctx);
  ctx.title('- Home -');
  ctx.info(`
Welcome to my hole! Yes, 'hole' really is the word people use for a
site on the gopher protocol. I've had a Gopher site on and off for a
few times, but it's finally time to have a more permanent spot on the
smolweb.

This space is pretty empty right now, but I hope to fill it with a bit
more content over time.

`);
  ctx.title('- Menu -');
  ctx.directory('About this hole', '/about');
  ctx.directory('Projects', '/projects');
  ctx.directory('Friends with holes', '/friends');
  ctx.directory('Interesting Gopher Sites', '/links');

  ctx.info('');
  ctx.search('Sign my guestbook', '/guestbook');
  ctx.directory('View my guestbook', '/guestbook');
  ctx.info('');
  ctx.link('My website', 'https://evertpot.com/');
  ctx.link('My mastodon', 'https://indieweb.social/evert');
  ctx.link('Link to source on Github', 'https://github.com/evert/hole');

});

server.route('/about', ctx =>  {

  banner(ctx);
  ctx.title('- About this hole -');
  ctx.info(`
When I just got on the internet and started making websites, I was
always fascinated by protocols. I'm slightly too young for Gopher's
heyday, but I remember 'gopher' be one of the things you could
specify a proxy for in early Internet Explorer, and randomly ran into
gopher:// sites back when all major browsers still had built-in
support for this.

Back in 2006 I decided to make a little gopher server with PHP and
inentd. It didn't go very far, but gopher's just kinda been in the
back of my mind ever since.
`);
  ctx.link('My original Gopher server', 'https://evertpot.com/100/');

  ctx.info(`
Bacause it\'s not super easy to set up a free Gopher server due to
needing an IP address (no vhosts on gopher), I never really got around
to making a permanent site. But 20 years later in 2026, I finally have
a little homelab I can run this on.

So I decided to make a new server, this time in Node.js. But in the
last 20 years, my reason for making this has also changed a bit. While
originally it may just have been a novelty, now gopher feels a bit
more like a respite from the normal web that's been overrun by ads,
corporate interests, AI, misinformation and toxic short form content.

My server is open source, if you want to take a look or fork it to
make your own hole own.
`);

  ctx.link('Server source on Github', 'https://github.com/evert/hole');

  ctx.info(`
So what is this going to be?

I have a blog on https://evertpot.com/ as well, but it's mostly
technical. I might use this space as a slightly more casual and
personal space, but not sure yet!
`);

  ctx.link('My HTTP blog', 'https://evertpot.com/');
  ctx.info('');

  ctx.directory('Go back to home', '/');

});

server.route('/friends', ctx =>  {

  banner(ctx);
  ctx.title('# Friends with holes');
  ctx.info(`
Sadly I don't have any friends yet that I can link to. Here's hoping
this changes in the future!`);

  ctx.directory('Go back to home', '/');

});

server.route('/guestbook', async ctx => {

  banner(ctx);
  if (ctx.query) {
    ctx.info(`Thanks for signing my guestbook, "${ctx.query}"!`);
    await fs.appendFile('guestbook.txt', `${new Date().toISOString()} - ${ctx.query}\n`);
  }

  ctx.info('');
  ctx.title(`# Guestbook`);
  ctx.info('');
  ctx.info(await fs.readFile('guestbook.txt', 'utf-8').catch(() => 'No entries yet! Sign the guestbook to be the first one!'));

  ctx.info('');
  if (!ctx.query) ctx.search('Sign my guestbook', '/guestbook');
 
  ctx.directory('Go back to home', '/');

});

server.route('/links', ctx => {

  banner(ctx);
  ctx.title(`# Interesting Gopher Sites`);
  ctx.info('');
  ctx.link('Phetech gopher client', 'gopher://phkt.io/1/phetch');
  ctx.link('Steven Frank\'s Gopher Site', 'gopher://stevenf.com/');
  ctx.info('');
  ctx.directory('Go back to home', '/');

});

server.route('/projects/burrow', ctx => {

  banner(ctx, 'burrow');
  ctx.title('# Burrow');

  ctx.info(`

Burrow is a Gopher client and HTTP proxy, written in Javascript.

There's already a bunch of well-known public gopher to HTTP proxies
out there, but I wanted to try my hand at one that evokes the feeling
of 90's browsers and a bit more whimsy.

It doesn't support every Gopher feature (notably, it doesn't support
search yet) and I'm not sure how far I'll take this, but it's open
source if you want to take a look or play around with it.
`);

  ctx.link('Try it', 'https://burrow.din.gy/');
  ctx.link('Burrow source on Github', 'https://github.com/evert/burrow');

  ctx.info('');
  ctx.directory('Go back to home', '/');

});
