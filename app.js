var scheduler     = require('node-schedule'),        // https://github.com/mattpat/node-schedule
    LastfmNode    = require('lastfm').LastFmNode,    // https://github.com/jammus/lastfm-node
    Lastfm        = require('./src/lastfm'),
    ScrobbleShift = require('./src/scrobbleShift');

var config = {
        api_key: process.env.API_KEY,
        secret:  process.env.API_SECRET,
        sk:      process.env.API_SESSION_KEY,
    };

var lastfmNode = new LastfmNode({api_key: config.api_key, secret: config.secret});
var lastfm = Lastfm.create(lastfmNode, config.sk);
var scrobbleShift = ScrobbleShift.create(scheduler, lastfm, "last.hq", 1);

scrobbleShift.start();