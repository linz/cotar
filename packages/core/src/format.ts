export const IndexMagic = 'COT';
export const IndexVersion = 2;

/** Number of bytes used to represent a Header/Footer */
export const IndexHeaderSize = 8;
export const IndexFooterSize = IndexHeaderSize;
/** Total size used by the header/footer */
export const IndexSize = IndexHeaderSize + IndexFooterSize;

/** 8 bytes hash, 4 bytes offset, 4 bytes size*/
export const IndexV2RecordSize = 16;
