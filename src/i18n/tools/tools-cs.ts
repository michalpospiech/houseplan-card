import dictionary from './cs.json' with { type: 'json' };

/** #780: lazy `tools` × `cs` chunk; must match the entry build before it is committed. */
export const fingerprint = '__HOUSEPLAN_SOURCE_FINGERPRINT__';

export { dictionary };
