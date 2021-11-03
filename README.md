# Cotar - Cloud optimized tar archive

.tar + .tar.index + AWS S3 = :heart:

## Why

Storing 100,000,000's of small file in cloud providers (S3, GCP) is expensive as each individual file update counts as a put request and for each 1M files costs around $5 USD to add to Amazon S3. This often limits how often files can be updated.

To work around this issue files can be packed into a archive so there is only one put/get request to receive all the files. However generally to extract a single file from most archives generally requires a full copy of the archive to find the file and extract it. This forces the user to download GBs of data when they only want a single file of a few KB.

Cotar works by creating a index of any `.tar` file whereby any individual file inside the archive can be extracted by using a single HTTP range request to the `.tar` archive.


## Requirements

- Supports any tar file and any contents - Currently focused on Mapbox vector tiles (MVT)
- Should be able to handle large 100GB+ tar files with millions of internal files
- Index should be small and/or compressed to save space
- Should be able to fetch ideally any file inside a archive with a minimal amount of requests (Ideally 1-2)

## Tar files

TAR files contain a collection of files stored sequentially into the file. With every file containing a 512 byte header just before the file data is stored.

This makes it very easy to add new files to a archive as more files can just be appended to the end, however this makes random reads impossible, as every file header would have to be read until the specific file wanted would be found 

![TarFileBackground](./static/TarFileBackground.png)

### Tar Index
TAR Index (.cotar.index) is a binary file containing the location and size of a file inside of a tar. with this index a tar file can be randomly read.

![TarFileIndex](./static/TarFileIndex.png)


### Performance

Performance regression is monitored with [hyperfine-action](https://github.com/blacha/hyperfine-action) with results being hosted on github pages [benchmarks.html](https://linz.github.io/cotar/benchmarks.html)

#### Questions:
**Offset size `uint32` vs `uint64`**
Large files will need large offsets 64 bit offsets give huge file support but need quite a few more bytes per record to store than `uint32`, for smaller files a `uint32` or `uint16` may be enough

**Hash size**
The type of the hash could be changed as well as the number of bits of the hash used based on how unique the file hashes are, a uint64 hash is mostly completely wasted on a tar file containing 100 files. 
conversely a tar file containing 2,000,000 files needs a hash much larger than 16bits

**Hash type**
`FNV-1a` was chosen as it is implementation simplicity and provides a pretty good [distribution](https://softwareengineering.stackexchange.com/questions/49550/which-hashing-algorithm-is-best-for-uniqueness-and-speed) of hash values for a 64bit hash. 
Any hash type could be used `farmhash` or even `sha256` and then the bits sliced down to the number needed for the hash index.


**Configuring the record size**
Based on Offset size, hash size and type, these could be configured in the index's header/footer by putting the number of bytes needed for offset/hash/size as variables into the header. 
This will slightly add to the index size but the main issue it adds to the complexity of reading the file.

for example the next generation header could look like
```
Magic: "COT"
version: 0x02
count: 0x72365123 // uint32 for record count (Limited to ~4 billion files)
offset: 0x04 // 4 bytes for offset (uint32)
size: 0x02 // 2 byte for size (uint16)
hash: 0x08 // 8 bytes for hash (uint64)
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
