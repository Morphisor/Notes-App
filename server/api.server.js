'use sctrict';

const register = require('react-server-dom-webpack/node-register');
register();

const babelRegister = require('@babel/register');

babelRegister({
  ignore: [/[\\\/](build|server|node_modules)[\\\/]/],
  presets: [['react-app', { runtime: 'automatic' }]],
  plugins: ['@babel/transform-modules-commonjs'],
});

const express = require('express');
const expressSession = require('express-session');
const compress = require('compression');
const { pipeToNodeWritable } = require('react-server-dom-webpack/writer');
const path = require('path');
const React = require('react');
const ReactApp = require('../src/App.server').default;
const { readFileSync } = require('fs');

const passport = require('passport');
const Auth0Strategy = require('passport-auth0');

require('dotenv').config();

const authRouter = require('./auth.server');

const NotesDataAccess = require('./db.server');

const PORT = 4000;
const app = express();

const session = {
  secret: process.env.SESSION_SECRET,
  cookie: {},
  resave: false,
  saveUninitialized: false
};

const strategy = new Auth0Strategy({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  callbackURL: process.env.AUTH0_CALLBACK_URL
},
  function (accessToken, refreshToken, extraParams, profile, done) {
    return done(null, profile);
  });


app.use(compress());
app.use(express.json());
app.use(expressSession(session));

passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

app.use('/', authRouter);

app.listen(PORT, () => {
  console.log('Notes App backend listening at 4000...');
});


app.get(
  '/',
  secured,
  handleErrors(async function (_req, res) {
    await waitForWebpack();
    const html = readFileSync(
      path.resolve(__dirname, '../build/index.html'),
      'utf-8'
    );

    // Note: this is sending an empty HTML shell, like a client-side-only app.
    // However, the intended solution (which isn't built out yet) is to read
    // from the Server endpoint and turn its response into an HTML stream.
    res.send(html);
  })
);

app.get('/react', secured, function (req, res) {
  sendResponse(req, res, null);
});

app.get(
  '/notes',
  onlyLocal,
  handleErrors(async function (_req, res) {
    const notesDA = new NotesDataAccess();
    const notes = await notesDA.getNotes(_req.query.searchtext);
    res.json(notes);
  })
);

app.post(
  '/notes',
  secured,
  handleErrors(async function (req, res) {
    const notesDA = new NotesDataAccess();
    const insertedId = await notesDA.insertNote(req.body.body, req.body.title);
    sendResponse(req, res, insertedId);
  })
);

app.put(
  '/notes/:id',
  secured,
  handleErrors(async function (req, res) {
    const id = req.params.id;
    const notesDA = new NotesDataAccess();
    await notesDA.updateNote(id, req.body.body, req.body.title);
    sendResponse(req, res, null);
  })
);

app.delete(
  '/notes/:id',
  secured,
  handleErrors(async function (req, res) {
    const id = req.params.id;
    const notesDA = new NotesDataAccess();
    await notesDA.deleteNote(id);
    sendResponse(req, res, null);
  })
);

app.get(
  '/notes/:id',
  onlyLocal,
  handleErrors(async function (req, res) {
    const id = req.params.id;
    const notesDA = new NotesDataAccess();
    const result = await notesDA.getNoteById(id);
    res.json(result);
  })
);

app.use(express.static('build'));
app.use(express.static('public'));

app.on('error', function (error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
});

function secured(req, res, next) {
  if (req.user) {
    return next();
  }
  res.redirect("/login");
};

function handleErrors(fn) {
  return async function (req, res, next) {
    try {
      return await fn(req, res);
    } catch (x) {
      next(x);
    }
  };
}

function onlyLocal(req, res, next) {
  const ip = req.connection.remoteAddress;
  const host = req.get('host');

  const localAddress = ip === "127.0.0.1" || ip === "::ffff:127.0.0.1" || ip === "::1" || host.indexOf("localhost") !== -1;
  if (localAddress) {
    return next();
  }

  res.status(403);
}

async function waitForWebpack() {
  while (true) {
    try {
      readFileSync(path.resolve(__dirname, '../build/index.html'));
      return;
    } catch (err) {
      console.log(
        'Could not find webpack build output. Will retry in a second...'
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

async function renderReactTree(res, props) {
  await waitForWebpack();
  const manifest = readFileSync(
    path.resolve(__dirname, '../build/react-client-manifest.json'),
    'utf8'
  );
  const moduleMap = JSON.parse(manifest);
  pipeToNodeWritable(React.createElement(ReactApp, props), res, moduleMap);
}

function sendResponse(req, res, redirectToId) {
  const location = JSON.parse(req.query.location);
  if (redirectToId) {
    location.selectedId = redirectToId;
  }
  res.set('X-Location', JSON.stringify(location));
  renderReactTree(res, {
    selectedId: location.selectedId,
    isEditing: location.isEditing,
    searchText: location.searchText,
  });
}

