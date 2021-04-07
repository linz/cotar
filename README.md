# Cotar - Cloud optimized tar archive

.tar + .tar.index + AWS S3 = :heart:

## Requirements

- Supports any tar file and any contents (Currently focused on MVT)
- Should be able to handle large 100GB+ tar files with millions of internal files
- Index should be small and/or compressed to save space
- Should be able to fetch ideally any file inside a archive with a minimal amount of requests (Ideally 2)

## Usage
Create a cloud tar file

```
npm i -g @cotar/cli

cotar create inputFile.tar
```


## Tar files

TAR files contain a collection of files stored sequentially into the file. With every file containing a 512 byte header just before the file data is stored.

This makes it very easy to add new files to a archive as move files can just be appended to the end, however this makes random reads impossible, as every file header would have to be read until the specific file wanted would be found 

![TarFileBackground](./static/TarFileBackground.png)

### Tar Index
TAR Index (.tar.index) is a JSON document containing the file location and size inside of a tar file. with this index a tar file can be randomly read.

![TarFileIndex](./static/TarFileIndex.png)

```typescript
/** Mapping of path -> index records */
type TarIndex = TarIndexFile[];

interface TarIndexFile [ 
    string, // Name of the file @see header.path
    number, // Offset to the start of the data
    number // Number of bytes inside the file 
]
```

#### Example Index

```json
[
  ["src/create/tar.to.ttiles.ts",1536,2610],
  ["src/index.ts",5120,38],
  ["src/log.ts",6144,163],
  ["src/commands/info.ts",7680,1069],
  ["src/commands/create.ts",9728,1280]
]
```

## Future investigation

1. Zip files

ZIP store their metadata at the end of the file, and so the metadata can be read with a single range request for the last 1+MB of data.
then individual files can be read directly from the ZIP.

See: https://github.com/tapalcatl/tapalcatl-2-spec
> 2021-04 comments
> The internal zip header is quite large with a 600,000 file test zip, the header was 55MB vs a 5MB gziped header using JSON


2. Combine tar with tar.index into a single tar

Having a single tar file greatly simplifies the distribution of the files, It would be quite simple to tar both the index (.tar.index) and data tar into another tar to combine the files into a single distribution

3. Use AWS S3's response-encoding to decompress internal gziped content on the fly

4. Change index structure to a binary format, there could be multiple indexes

5. Investigate a BTree index

6. Investigate if MPQ could be a better format

7. Store only the pointer to the header, as the file size is stored in the tar file header.

8. Store only the offset difference from the last index to save space