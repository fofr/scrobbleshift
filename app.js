
var DateUtils = require('date-utils'),          // https://github.com/JerrySievert/node-date-utils
    schedule = require('node-schedule'),        // https://github.com/mattpat/node-schedule
    LastFmNode = require('lastfm').LastFmNode,  // https://github.com/jammus/lastfm-node
    lastfm = require('./src/lastfm');

var config = {
        api_key: process.env.API_KEY,
        secret:  process.env.API_SECRET,
        sk:      process.env.API_SESSION_KEY,
    };

if (typeof config.api_key === "undefined") {
    try {
        config = require('./config.js');
    } catch (ex) {
        console.log('Error: Couldn\'t find a config. Set environment variables or create a config.js file using setup.js');
    }
}

lastfm.start(new LastFmNode({api_key: config.api_key, secret: config.secret}), config.sk);

var years = 1;
var username = "last.hq";
var toScrobble = [];

getScrobblesFromThisHourOnThisDayInTheYear();
setInterval(function() {
    getScrobblesFromThisHourOnThisDayInTheYear();
}, 3600000);

function getScrobblesFromThisHourOnThisDayInTheYear() {

    var now = new Date();
    var thisTimelastYear = now.clone().addYears(-years);
    var lowerBound = Math.floor(+thisTimelastYear/1000);
    var upperBound = Math.floor(+thisTimelastYear.clone().addHours(1) / 1000);

    lastfm.getScrobbles(username, lowerBound, upperBound, function(error, scrobbles) {
        if ( ! error) {
            scheduleScrobbles(scrobbles);
        } else {
            console.log("Error: " + error.message);
        }
    });
}

function scheduleScrobbles(scrobbles) {

    // console.log(tracks.length);

    for(var i = 0, l = scrobbles.length; i < l; i++) {

        var scrobble = scrobbles[i];

        // Ignore now playing tracks (which always get included).
        if (scrobble['@attr']) {
            continue;
        }

        var shiftedScrobbleDate = new Date(scrobble.date.uts * 1000).addYears(years);
        var shiftedScrobble = {
                artist: scrobble.artist['#text'],
                track: scrobble.name,
                album: scrobble.album['#text'],
                timestamp: +shiftedScrobbleDate / 1000,
                time: shiftedScrobbleDate.toString()
            };

        toScrobble.push(shiftedScrobble);
        schedule.scheduleJob(shiftedScrobbleDate, scrobbleNext);
    }

    // console.log(toScrobble);
}

function scrobbleNext() {
    var scrobble = toScrobble.pop();
    lastfm.scrobble(scrobble);
    nowPlayingNext();
}

function nowPlayingNext() {

    var l = toScrobble.length;

    if (l == 0) {
        return;
    }

    var nextScrobble = toScrobble[l - 1];
    var whenNextTrackWillScrobble = new Date(nextScrobble.timestamp * 1000);
    var now = new Date();

    if (now.getMinutesBetween(whenNextTrackWillScrobble) > 10) {
        return;
    }

    lastfm.updateNowPlaying(nextScrobble, now.getSecondsBetween(whenNextTrackWillScrobble));
}
