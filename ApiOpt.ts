import Api from './Api.js';

/**
 * Optional api requests (statistics/telemetry), reccomended to keep pandora happy
 */
class ApiOpt extends Api {
    constructor() {
        super();
    }
    async started(): Promise<void> {
        if (!this.src || !this.ogSrc) return; // nbd
        await this.rest('/api/v1/event/started', {
            deviceProperties: this.deviceProperties(),
            deviceUuid: this.uuid,
            elapsedTime: 0,
            index: this.src.item.index,
            sourceId: this.ogSrc.pandoraId
        });
    }
}

export default ApiOpt;