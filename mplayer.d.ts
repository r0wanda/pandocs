declare interface Status {
    muted: boolean;
    playing: boolean;
    /**
     * Percentage
     */
    volume: number;
    /**
     * Seconds
     */
    duration: number;
    fullscreen: boolean;
    subtitles: boolean;
    filename: string;
    title: string;
}

declare module 'mplayer';