export namespace PandoraChecks {
    export namespace Rest {
        export function isGraphQL(r: PandoraRest): r is PandoraRest.GraphQL {
            var g = r as PandoraRest.GraphQL;
            return !!g.data;
        }
        export function isPlaylists(r: PandoraRest): r is PandoraRest.Playlists {
            var p = r as PandoraRest.Playlists;
            return p.view && p.view === 'PL';
        }
        export function isItems(r: PandoraRest): r is PandoraRest.Items {
            var i = r as PandoraRest.Items;
            var p = r as PandoraRest.Playlists;
            return i.items && !p.annotations;
        }
        export function isStations(r: PandoraRest): r is PandoraRest.Stations {
            var s = r as PandoraRest.Stations;
            return !!s.stations;
        }
        export function isInfo(r: PandoraRest): r is PandoraRest.Info {
            var i = r as PandoraRest.Info;
            return !!i.subscriber;
        }
        export function isSource(r: PandoraRest): r is PandoraRest.Source {
            var i = r as PandoraRest.Source;
            return !!i.item.audioUrl;
        }
        export function isPeek(r: PandoraRest): r is PandoraRest.Peek {
            var i = r as PandoraRest.Source;
            return isSource(i) && !i.source;
        }
        export function isSkip(r: PandoraRest): r is PandoraRest.Skip {
            return isPeek(r); // peek = source
        }
        export function isConcerts(r: PandoraRest): r is PandoraRest.Concerts {
            var c = r as PandoraRest.Concerts;
            return Array.isArray(c.artistEvents);
        }
    }
    export function isPlaylist(i: Annotations.Playlist | Annotations.PlaylistCurator): i is Annotations.Playlist {
        var p = i as Annotations.Playlist;
        return p.type === 'PL';
    }
    export function isArtist(i: Annotations.Album | Annotations.Artist | Annotations.Track): i is Annotations.Artist {
        var p = i as Annotations.Artist;
        return p.type === 'AR';
    }
    export function isTrack(i: Annotations.Album | Annotations.Artist | Annotations.Track): i is Annotations.Track {
        var p = i as Annotations.Track;
        return p.type === 'TR';
    }
}
