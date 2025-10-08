export type Metadata = {
    page?: number;
    completed?: boolean;
};

export const TIME_MULTIPLIERS: Record<string, number> = {
    Y: 31556952000,
    YR: 31556952000,
    YEAR: 31556952000,
    YEARS: 31556952000,
    MO: 2592000000,
    MOS: 2592000000,
    MONTH: 2592000000,
    MONTHS: 2592000000,
    W: 604800000,
    WEEK: 604800000,
    WEEKS: 604800000,
    D: 86400000,
    DAY: 86400000,
    DAYS: 86400000,
    H: 3600000,
    HR: 3600000,
    HOUR: 3600000,
    HOURS: 3600000,
    M: 60000,
    MIN: 60000,
    MINUTE: 60000,
    MINUTES: 60000,
    S: 1000,
    SEC: 1000,
    SECOND: 1000,
    SECONDS: 1000,
};
