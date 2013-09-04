var lastfm, session;

module.exports.start = function(lastFmNodeInstance, sessionKey) {
    lastfm = lastFmNodeInstance;
    session = lastfm.session({key: sessionKey});
};

module.exports.getScrobbles = function(user, from, to, callback) {

    var scrobbles;

    lastfm.request('user.getRecentTracks', {
        user: user,
        limit: 200,
        from: from,
        to: to,
        handlers: {
            success: function(data) {

                scrobbles = data.recenttracks.track;

                if (! scrobbles) {
                    scrobbles = [];
                }

                scrobbles = scrobbles instanceof Array ? scrobbles : [scrobbles];

                callback(null, scrobbles);
            },
            error: function(error) {
                callback(error);
            }
        }
    });
};

module.exports.scrobble = function(scrobble) {
    lastfm.update('scrobble', session, scrobble);
};

module.exports.updateNowPlaying = function(scrobble, durationInSeconds) {
    lastfm.update('nowplaying', session,
        {
            artist: scrobble.artist,
            track: scrobble.track,
            album: scrobble.album,
            duration: durationInSeconds
        }
    );
};
