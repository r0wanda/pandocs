declare namespace PandoraTypes {
    export type Uuid = string;
    export type NumericId = number;
    export type FactoryId = string;
    export type UrlPath = string;
    export type Id = string;
    export type ItemType = 'PL' | 'TR' | 'AL' | 'AR' | 'LI' | 'SF' | 'CU' | 'AP';
    export namespace ItemType {
        export type Playlist = 'PL';
        export type PlaylistCurator = 'LI';
        export type Track = 'TR';
        export type Album = 'AL';
        export type Artist = 'AR';
        export type StationCurator = 'SF';
        export type Curator = 'CU';
        export type ArtistPlay = 'AP';
    }
    export type UnixTimestamp = number;
    export type UnixTimestampString = string;
    /**
     * ThorLayers is a goofy little string representation of a playlist cover image, details on parsing are contained with in the parseThor Api method.
     */
    export type ThorLayers = string;
    export type ParsedThorLayers = Array<string>;
    export type Seconds = number;
    /**
     * The only known value is "MOST_RECENT_MODIFIED". It is reccomended that clients handle sorting themselves.
     */
    export type SortOrder = string | 'MOST_RECENT_MODIFIED';
    /**
     * Known types are SharedListening, and StationThumbs
     * If the type is StationThumbs
     */
    export type LinkedType = 'StationThumbs' | 'SharedListening' | string;
    export namespace LinkedType {
        export type StationThumbs = 'StationThumbs';
        export function isThumbs(t: LinkedType): t is LinkedType.StationThumbs {
            return t === 'StationThumbs';
        }
        export type SharedListening = 'SharedListening';
        export function isShared(t: LinkedType): t is LinkedType.SharedListening {
            return t === 'SharedListening';
        }
    }
    export type ArtUrlFragment = PandoraTypes.UrlPath;
    export type ArtUrl = string;
    export type HexColor = string;
}

declare namespace Annotations {
    export interface Playlist {
        scope: string;
        type: PandoraTypes.ItemType.Playlist;
        pandoraId: PandoraTypes.Id;
        version: number;
        name: string;
        description: string;
        timeCreated: PandoraTypes.UnixTimestamp;
        isPrivate: boolean;
        secret: boolean;
        linkedType: string | 'None';
        totalTracks: number;
        shareableUrlPath: PandoraTypes.UrlPath;
        thorLayers: PandoraTypes.ThorLayers;
        duration: PandoraTypes.Seconds;
        unlocked: boolean;
        timeLastUpdated: PandoraTypes.UnixTimestamp;
        viewerInfo: {
            editable: boolean;
        }
        autogenForListener: boolean;
        listenerIdInfo: {
            listenerId: PandoraTypes.NumericId;
            listenerPandoraId: PandoraTypes.Id;
            listenerIdToken: string;
        }
        includedTrackTypes: Array<PandoraTypes.ItemType>;
        collectible: boolean;
        listenerId: PandoraTypes.NumericId;
        listenerPandoraId: PandoraTypes.Id;
        listenerIdToken: string;
    }
    export interface PlaylistCurator {
        pandoraId: PandoraTypes.Id;
        type: PandoraTypes.ItemType.PlaylistCurator;
        listenerId: PandoraTypes.NumericId;
        webname: string;
        fullname: string;
        displayname: string;
    }
}

declare namespace PandoraGraphQLEntities {
    export interface StationCurator {
        pandoraId: PandoraTypes.Id;
        curator: {
            pandoraId: PandoraTypes.Id;
            name: string;
            shareableUrlPath: PandoraTypes.UrlPath;
            artist: null;
        } | null;
    }
}
declare type PandoraGraphQLEntity = PandoraGraphQLEntities.StationCurator;

declare namespace PandoraSimpleItems {
    export interface Track {
        pandoraId: PandoraTypes.Id;
        pandoraType: PandoraTypes.ItemType.Track;
        albumPandoraId: PandoraTypes.Id;
        addedTime: PandoraTypes.UnixTimestamp;
        updatedTime: PandoraTypes.UnixTimestamp;
    }
    export interface Playlist {
        pandoraId: PandoraTypes.FactoryId;
        pandoraType: PandoraTypes.ItemType.Playlist;
        linkedType: PandoraTypes.LinkedType;
        linkedSourceId: string;
        addedTime: PandoraTypes.UnixTimestamp;
        updatedTime: PandoraTypes.UnixTimestamp;
        ownerId?: PandoraTypes.NumericId;
        ownerPandoraId?: PandoraTypes.Id;
    }
    export interface Album {
        pandoraId: PandoraTypes.Id;
        pandoraType: PandoraTypes.ItemType.Album;
        addedTime: PandoraTypes.UnixTimestamp;
        updatedTime: PandoraTypes.UnixTimestamp;
    }
}

declare type PandoraSimpleItem = PandoraSimpleItems.Album | PandoraSimpleItems.Playlist | PandoraSimpleItems.Track;

declare namespace OtherPandoraInterfaces {
    export interface Icon {
        artId: PandoraTypes.ArtUrlFragment;
        dominantColor: PandoraTypes.HexColor | null;
        artUrl: PandoraTypes.ArtUrl;
        _typename: 'Art';
    }
}

declare namespace PandoraComplexItems {
    export interface Playlist {
        name: string;
        pandoraId: PandoraTypes.FactoryId;
        pandoraType: PandoraTypes.ItemType.Playlist;
        addedTime: PandoraTypes.UnixTimestamp;
        updatedTime: PandoraTypes.UnixTimestamp;
    }
    export interface RecentlyPlayed {
        sourceEntity: {
            id: PandoraTypes.Id;
            type: PandoraTypes.ItemType;
            name?: string;
            isCollected?: boolean;
            shareableUrlPath?: PandoraTypes.UrlPath;
            artist?: {
                id: PandoraTypes.Id;
                name: string;
                shareableUrlPath: PandoraTypes.UrlPath;
                icon?: OtherPandoraInterfaces.Icon;
                _typename: string;
            }
            icon?: OtherPandoraInterfaces.Icon;
            rightsInfo?: {
                expirationTime: PandoraTypes.UnixTimestampString;
                hasInteractive: boolean;
                hasRadioRights: boolean;
                hasOffline: boolean;
                _typename: 'Rights';
            }
            totalTracks?: number;
            isEditable?: boolean;
            hasVoiceTrack?: boolean;
            listenerIdInfo?: {
                id: PandoraTypes.Id;
                displayName: string;
                isMe: boolean;
                _typename: 'Profile';
            }
        }
        _typename: 'RecentlyPlayedSource';
    }
}

declare namespace PandoraRest {
    export interface Playlists {
        view: PandoraTypes.ItemType.Playlist;
        listenerId: PandoraTypes.NumericId;
        listenerPandoraId: PandoraTypes.Id;
        totalCount: number;
        offset: number;
        limit: number;
        annotations: {
            [key: PandoraTypes.FactoryId]: Annotations.Playlist | Annotations.PlaylistCurator;
        }
        sortOrder: PandoraTypes.SortOrder;
        version: number;
        items: Array<PandoraComplexItems.Playlist>;
    }
    export interface Items {
        listenerId: PandoraTypes.NumericId;
        limit: number;
        version: number;
        items: Array<PandoraSimpleItem>;
    }
    export interface GraphQL {
        data: {
            entities?: Array<PandoraGraphQLEntity>;
            recentlyPlayedSources?: {
                items: Array<PandoraComplexItems.RecentlyPlayed>;
                /**
                 * Should bear some resemblence to the sent OperationName
                 */
                _typename: string;
            }
        }
    }
}
declare type PandoraRest = PandoraRest.Playlists | PandoraRest.Items | PandoraRest.GraphQL;
