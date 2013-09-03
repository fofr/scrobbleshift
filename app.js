var config = require('./config.js'),

    // https://github.com/JerrySievert/node-date-utils
    DateUtils = require('date-utils'),

    // https://github.com/mattpat/node-schedule
    schedule = require('node-schedule'),

    // https://github.com/jammus/lastfm-node
    Lastfm = require('lastfm').LastFmNode,

    lastfm = new Lastfm({
        api_key: config.api_key,
        secret: config.secret
    }),
    session = lastfm.session({key: config.sk}),
    years = 1,
    username = "last.hq";

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

    lastfm.request('user.getRecentTracks', {
        user: username,
        limit: 200,
        from: lowerBound,
        to: upperBound,
        handlers: {
            success: function(data) {
                scheduleScrobbles(data.recenttracks.track);
            },
            error: function(error) {
                console.log("Error: " + error.message);
            }
        }
    });
}

function scheduleScrobbles(tracks) {

    if (! tracks) {
        return;
    }

    if (! tracks instanceof Array) {
        tracks = [tracks];
    }

    // console.log(tracks.length);

    for(var i = 0, l = tracks.length; i < l; i++) {

        var track = tracks[i];

        if (track['@attr']) {
            continue;
        }

        var trackDate = new Date(track.date.uts * 1000).addYears(years);
        var params = {
                artist: track.artist['#text'],
                track: track.name,
                album: track.album['#text'],
                timestamp: +trackDate / 1000,
                time: trackDate.toString()
            };

        toScrobble.push(params);
        schedule.scheduleJob(trackDate, scrobbleNext);
    }

    // console.log(toScrobble);
}

function scrobbleNext() {
    var scrobble = toScrobble.pop();
    lastfm.update('scrobble', session, scrobble);
    nowPlayingNext();
}

function nowPlayingNext() {

    var l = toScrobble.length;

    if (l == 0) {
        return;
    }

    var nowPlaying = toScrobble[l - 1];
    var whenNowPlayingWillScrobble = new Date(nowPlaying.timestamp * 1000);
    var now = new Date();

    if (now.getMinutesBetween(whenNowPlayingWillScrobble) > 10) {
        return;
    }

    lastfm.update('nowplaying', session,
        {
            artist: nowPlaying.artist,
            track: nowPlaying.track,
            album: nowPlaying.album,
            duration: now.getSecondsBetween(whenNowPlayingWillScrobble)
        }
    );

}
