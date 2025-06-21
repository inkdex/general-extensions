export interface WebtoonDto {
    result: WebtoonResultDto;
    success: boolean;
    message?: string;
}

export type WebtoonResultDto = WebtoonChaptersListDto;
//  | OtherDto; if one day they exists

export interface WebtoonChaptersListDto {
    episodeList: WebtoonChaptersElemDto[];
    nextCursor: number;
}

export interface WebtoonChaptersElemDto {
    episodeNo: number;
    thumbnail: string;
    episodeTitle: string;
    viewerLink: string;
    exposureDateMillis: number;
    displayUp: boolean;
    hasBgm: boolean;
}
