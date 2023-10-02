/// <reference path="ptypes.d.ts"/>

// @ts-ignore
import got, { PlainResponse } from 'got';
import UserAgent from 'user-agents';
import { CookieJar, Cookie } from 'tough-cookie';
import Login from './Login.js';
import * as gql from './graphql.js';
import { v4 as uuidv4 } from 'uuid';
import tmp from 'tmp';
import MPlayer from 'mplayer';
import { PandoraChecks } from './PandoraChecks.js';
import { parseBuffer as musicMD } from 'music-metadata';
import { fileTypeFromBuffer as magic } from 'file-type';
import { writeFileSync as wf, readFileSync as rf } from 'fs';

class Api extends Login {
    csrf: string;
    ua: string;
    cookieJar: CookieJar;
    uuid: string;
    mplay;
    metad: object | null;
    src?: PandoraRest.Source | PandoraRest.Peek;
    time: number;
    ogSrc?: PandoraRest.OgSource;
    constructor() {
        super();
        this.csrf = '';
        this.cookieJar = new CookieJar();
        this.ua = new UserAgent().toString();
        this.uuid = uuidv4();
        this.mplay = new MPlayer();
        this.metad = null;
        this.time = 0;

        this.mplay.on('time', (sec: number) => {
            this.time = sec;
        });
    }
    apiError() {
        return new Error('API response was invalid')
    }
    async init() {
        await super.init();
        await this.initCsrf();
        await this.cookieJar.setCookie(`csrftoken=${this.csrf}`, 'https://www.pandora.com');
        await this.checkCompat();
        console.error(await this.collection());
        //console.error(await this.current());
    }
    async initCsrf() {
        const res: PlainResponse = await got('https://www.pandora.com', {
            method: 'HEAD'
        });
        if (!res.headers['set-cookie']) throw new Error('Pandora HEAD request did not contain a set-cookie header');
        for (var _c of res.headers['set-cookie']) {
            if (!_c) continue;
            var parsed = Cookie.parse(_c);
            if (!parsed) continue;
            var c = parsed.toJSON();
            if (c.key === 'csrftoken') {
                this.csrf = c.value;
                break;
            }
        }
        if (!this.csrf) throw new Error('No CSRF token could be obtained');
    }

    async decode(rawData: Buffer, rawKey: PandoraTypes.XORKey) {
        // Parse key
        rawKey = atob(rawKey); // atob must be used, not Buffer.from
        const key = new Uint8Array(new ArrayBuffer(rawKey.length));
        for (var i = 0; i < rawKey.length; i++) {
            key[i] = rawKey.charCodeAt(i);
        }

        // Decode data
        const view = new Uint8Array(rawData);
        const keyView = new Uint8Array(new ArrayBuffer(key.byteLength));
        keyView.set(key);
        const res = new Uint8Array(new ArrayBuffer(rawData.byteLength));
        const curBufLen = rawData.byteLength;
        for (var i = 0; i < curBufLen; i++) {
            res[i] = keyView[i % keyView.length] ^ view[i];
        }
        console.error(await magic(res));
        return res;
    }

    async playAudio(buf: Uint8Array | Buffer) {
        this.metad = (await musicMD(buf)).format;
        const fname = tmp.fileSync().name;
        wf(fname, buf);
        this.mplay.openFile(fname);
    }

    async rest(path: string, json = {}, headers = {}): Promise<PandoraRest> {
        var url = new URL('https://www.pandora.com/');
        url.pathname = path;
        const res: PandoraRest = await got(url.href, {
            method: 'POST',
            headers: {
                'X-CsrfToken': this.csrf,
                'X-AuthToken': this.token,
                'Content-Type': 'application/json',
                'User-Agent': this.ua,
                'Accept': 'application/json, text/plain, */*',
                'Connection': 'keep-alive',
                ...headers
            },
            json,
            cookieJar: this.cookieJar
        }).json();
        return res;
    }
    async audio(url: string, key?: string) {
        var res: Buffer = await got(url, {
            method: 'GET',
            headers: {
                'Connection': 'keep-alive',
                'User-Agent': this.ua
            }
        }).buffer();
        var uint;
        if (key) uint = await this.decode(res, key);
        else uint = res;
        await this.playAudio(uint);
    }
    async graphql(json: object): Promise<PandoraRest.GraphQL> {
        const res = await this.rest('/api/v1/graphql/graphql', json);
        if (!PandoraChecks.Rest.isGraphQL(res)) throw new Error('API response was not GraphQL');
        return res;
    }
    async getStations(): Promise<PandoraRest.Stations> {
        const res = await this.rest('/api/v1/station/getStations', {
            pageSize: 250
        });
        if (!PandoraChecks.Rest.isStations(res)) throw this.apiError();
        return res;
    }
    async infoV2(): Promise<PandoraRest.Info> {
        const res = await this.rest('/api/v1/billing/infoV2');
        if (!PandoraChecks.Rest.isInfo(res)) throw this.apiError();
        return res;
    }
    async getSortedPlaylists(): Promise<PandoraRest.Playlists> {
        const res = await this.rest('/api/v6/collections/getSortedPlaylists', {
            allowedTypes: ['TR', 'AM'],
            isRecentModifiedPlaylists: false,
            request: {
                annotationLimit: 100,
                limit: 1000,
                sortOrder: 'MOST_RECENT_MODIFIED'
            }
        });
        if (!PandoraChecks.Rest.isPlaylists(res)) throw this.apiError();
        return res;
    }
    async getItems(): Promise<PandoraRest.Items> {
        const res = await this.rest('/api/v6/collections/getItems', {
            request: {
                limit: 1000
            }
        });
        if (!PandoraChecks.Rest.isItems(res)) throw this.apiError();
        return res;
    }
    async curateStations(stations: PandoraRest.Stations): Promise<Array<PandoraGraphQLEntity>> {
        var res = await this.graphql({
            operationName: 'GetStationCuratorsWeb',
            query: gql.STATION_CURATORS,
            variables: JSON.stringify({
                pandoraIds: stations.stations.map(s => s.stationFactoryPandoraId)
            })
        });
        if (!res.data.entities) throw this.apiError();
        return res.data.entities;
    }
    async recentlyPlayed(): Promise<Array<PandoraComplexItems.RecentlyPlayed>> {
        var res = await this.graphql({
            operationName: 'GetRecentlyPlayedSourcesWeb',
            query: gql.RECENTLY_PLAYED,
            variables: {
                limit: 10,
                types: gql.RECENTLY_PLAYED_TYPES
            }
        });
        if (!res.data.recentlyPlayedSources) throw this.apiError();
        return res.data.recentlyPlayedSources.items;
    }
    parseArt(art: Array<OtherPandoraInterfaces.Art>): Parsed.Art {
        var res: Map<string, string> = new Map();
        for (var a of art) res.set(a.size.toString(), a.url);
        return res;
    }
    /**
     * Parses "thor layers" obtained from the Pandora rest api.
     * @remarks
     * Thor layers are constructed in this format: _,:grid(images/most/of/art/url/path,images/url...)
     * The art urls are incomplete, missing the p-cdn url, also leaving out the filename (_widthW_heightH.jpg)
     * 
     * @param thor The thorLayers string obtained from a playlist object
     * @returns An array of artwork urls
     */
    parseThor(thor: PandoraTypes.ThorLayers): PandoraTypes.ParsedThorLayers {
        var arr = thor.split('images/');
        arr = arr.filter(i => i.includes('@1'))
        arr = arr.map(i => `https://content-images.p-cdn.com/images/${i.split('@1')[0]}_500W_500H.jpg`);
        return arr;
    }
    async collection() {
        const stations = await this.getStations();
        const curated = await this.curateStations(stations);
        var { annotations: _pl } = await this.getSortedPlaylists();
        var pl = Object.values(_pl);
        const it = await this.getItems();
        /*console.error('pl')
        console.error(pl);
        console.error('it');
        console.error(it);*/
        //onsole.error(pl);
        var stationList = [];
        for (var i = 0; i < stations.stations.length; i++) {
            const st = stations.stations[i];
            const cur = curated[i];
            var r = {
                orig: {
                    st,
                    cur
                },
                name: st.name,
                art: this.parseArt(st.art),
                id: st.pandoraId,
                stationId: st.stationId,
                factory: st.stationFactoryPandoraId,
                created: new Date(st.dateCreated),
                color: st.dominantColor,
                curator: cur.curator ? cur.curator.name : null
            }
            stationList.push(r);
        }
        var plList = [];
        for (var p of pl) {
            console.error(p)
            if (!PandoraChecks.isPlaylist(p)) continue;
            var plR = {
                orig: p,
                name: p.name,
                art: this.parseThor(p.thorLayers),
                id: p.pandoraId,
                tracks: p.totalTracks,
                created: new Date(p.timeCreated),
                updated: new Date(p.timeLastUpdated),
                duration: p.duration,
            }
            plList.push(plR);
            break;
        }
        var collection = [...plList, ...stationList];
        collection.sort()
        console.error('stationlist')
        //console.error(stationList);
    }
    async current() {
        return await this.rest('/api/v1/playback/current', {
            deviceProperties: this.deviceProperties(),
            deviceUuid: this.uuid,
            forceActive: true
        });
    }
    async source() {
        const res = await this.rest('/api/v1/playback/source', {
            deviceProperties: this.deviceProperties(),
            clientFeatures: [],
            deviceUuid: this.uuid,
            forceActive: true,
            includeItem: true,
            onDemandArtistMessageToken: '',
            skipExplicitCheck: true,
            sourceId: (await this.getStations()).stations[0].pandoraId
        });
        console.error(res);
        if (!PandoraChecks.Rest.isSource(res)) throw this.apiError();
        //console.error(res);
        this.src = res;
        this.ogSrc = res.source;
        await this.audio(res.item.audioUrl, res.item.key);
        return res;
    }
    async peek() {
        const res = await this.rest('/api/v1/playback/peek', {
            deviceProperties: this.deviceProperties(),
            clientFeatures: [],
            deviceUuid: this.uuid,
            forceActive: true,
            includeItem: true,
            onDemandArtistMessageToken: '',
            skipExplicitCheck: true,
            sourceId: (await this.getStations()).stations[0].pandoraId
        });
        console.error(res);
        if (!PandoraChecks.Rest.isSource(res)) throw this.apiError();
        //console.error(res);
        this.src = res;
        await this.audio(res.item.audioUrl, res.item.key);
        return res;
    }
    async skip() {
        const res = await this.rest('/api/v1/playback/peek', {
            deviceProperties: this.deviceProperties(),
            clientFeatures: [],
            deviceUuid: this.uuid,
            forceActive: true,
            includeItem: true,
            onDemandArtistMessageToken: '',
            skipExplicitCheck: true,
            sourceId: (await this.getStations()).stations[0].pandoraId
        });
        console.error(res);
        if (!PandoraChecks.Rest.isSource(res)) throw this.apiError();
        //console.error(res);
        this.src = res;
        await this.audio(res.item.audioUrl, res.item.key);
        return res;
    }
    async thumbUp() {
        if (!this.src || !this.ogSrc) return;
        if (this.ogSrc.type !== 'Station') return;
        await this.rest('/api/v1/action/thumbUp', {
            deviceProperties: this.deviceProperties(),
            deviceUuid: this.uuid,
            elapsedTime: this.time,
            index: this.src.item.index,
            pandoraId: this.src.item.pandoraId,
            sourceId: this.ogSrc.pandoraId,
            trackToken: this.src.item.trackToken
        });
    }
    async removeThumb() {
        if (!this.src || !this.ogSrc) return;
        if (this.ogSrc.type !== 'Station') return;
        await this.rest('/api/v1/action/removeThumb', {
            deviceProperties: this.deviceProperties(),
            deviceUuid: this.uuid,
            elapsedTime: this.time,
            index: this.src.item.index,
            pandoraId: this.src.item.pandoraId,
            sourceId: this.ogSrc.pandoraId,
            trackToken: this.src.item.trackToken
        });
    }
    async getConcerts() { // TODO: finish this + typedefs
        if (!this.src) throw new Error('No source');
        var id = '';
        for (var an of Object.values(this.src.annotations)) {
            if (!PandoraChecks.isArtist(an)) continue;
            id = an.pandoraId;
        }
        if (!id) throw new Error('No artist');
        const res = await this.rest('/api/v1/mip/getArtistPageConcerts', {
            pandoraId: id
        });
    }
    deviceProperties() {
        const d = new Date();
        if (!this.auth) throw new Error('Auth undefined');
        return {
            app_version: this.auth.webClientVersion,
            artist_collaborations_enabled: true,
            backgrounded: 'false',
            browser: 'Firefox',
            browser_id: 'Firefox',
            browser_version: '117.0', // TODO: get version and stuff from playwright
            campaign_id: 0,
            client_timestamp: d.getTime(),
            date_recorded: d.getTime(),
            day: `${d.getFullYear()}-${('0' + d.getMonth()).slice(-2)}-${('0' + d.getDate()).slice(-2)}`,
            device_code: '1880',
            device_id: '1880',
            device_os: 'Linux',
            device_uuid: this.uuid,
            is_on_demand_user: 'true',
            listenerId: this.auth.listenerId,
            music_playing: 'false',
            page_view: 'collection',
            promo_code: '',
            site_version: this.auth.webClientVersion,
            tuner_var_flags: 'SF',
            vendor_id: 100
        }
    }
    async isPremium() {
        return (await this.infoV2()).activeProduct.productTier.toLowerCase().includes('premium');
    }
    async checkCompat() {
        if (!await this.isPremium()) {
            console.error('Pandora Premium is the only product currently supported (free subscribers coming eventually) (maybe)');
            process.exit(0);
        }
    }
}

export default Api;
