import got from 'got';
import UserAgent from 'user-agents';
import { CookieJar, Cookie } from 'tough-cookie';
import Login from './Login.mjs';
import * as gql from './graphql.mjs';

class Api extends Login {
    csrf;
    ua;
    cookieJar;
    constructor() {
        super();
        this.cookieJar = new CookieJar();
        this.ua = new UserAgent().toString();
    }
    async init() {
        await super.init();
        await this.initCsrf();
        await this.cookieJar.setCookie(`csrftoken=${this.csrf}`, 'https://www.pandora.com');
        await this.checkCompat();
        console.log(await this.curateStations(await this.getStations()));
    }
    async initCsrf() {
        const res = await got('https://www.pandora.com', {
            method: 'HEAD'
        });
        for (var c of res.headers['set-cookie']) {
            c = Cookie.parse(c).toJSON();
            if (c.key === 'csrftoken') {
                this.csrf = c.value;
                break;
            }
        }
    }
    async rest(path, json = {}, headers = {}) {
        var url = new URL('https://www.pandora.com/');
        url.pathname = path;
        const res = await got(url.href, {
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
    async getStations() {
        return await this.rest('/api/v1/station/getStations', {
            pageSize: 250
        });
    }
    async infoV2() {
        return await this.rest('/api/v1/billing/infoV2');
    }
    async getSortedPlaylists() {
        return await this.rest('/api/v6/collections/getSortedPlaylists', {
            allowedTypes: ['TR', 'AM'],
            isRecentModifiedPlaylists: false,
            request: {
                annotationLimit: 100,
                limit: 1000,
                sortOrder: 'MOST_RECENT_MODIFIED'
            }
        });
    }
    async getItems() {
        return await this.rest('/api/v6/collections/getItems', {
            request: {
                limit: 1000
            }
        });
    }
    async curateStations(stations) {
        return (await this.rest('/api/v1/graphql/graphql', {
            operationName: 'GetStationCuratorsWeb',
            query: gql.STATION_CURATORS,
            variables: JSON.stringify({
                pandoraIds: stations.stations.map(s => s.stationFactoryPandoraId)
            })
        })).data.entities;
    }
    async isPremium() {
        return (await this.infoV2()).activeProduct.productTier.toLowerCase().includes('premium');
    }
    async checkCompat() {
        if (!await this.isPremium()) {
            console.log('Pandora Premium is the only product currently supported (free subscribers coming eventually) (maybe)');
            process.exit(0);
        }
    }
}

export default Api;