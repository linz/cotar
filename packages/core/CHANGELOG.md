# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.3.0](https://github.com/linz/cotar/compare/v5.2.0...v5.3.0) (2022-03-17)


### Bug Fixes

* **core:** v1 metadata should have a different offset size to v2 metadata ([1b86503](https://github.com/linz/cotar/commit/1b86503e33acfa4e52d577ed91d66e7f91496e39))





# [5.2.0](https://github.com/linz/cotar/compare/v5.1.1...v5.2.0) (2022-03-13)


### Bug Fixes

* cannot sort using bigint returns ([d18691d](https://github.com/linz/cotar/commit/d18691da666a13c6055e43e413ba2955b6ee6ae1))
* **core:** sort could still be unstable where multiple files reference the same offset (hard links) ([04cd0c8](https://github.com/linz/cotar/commit/04cd0c841f8e490863e360586aa5e7cfde9ca65c))
* skip over duplicate files inside tars ([e167bf7](https://github.com/linz/cotar/commit/e167bf78dfea2cb908f69c8fe5cdf5434a380863))
* **core:** make file sort stable ([42a5922](https://github.com/linz/cotar/commit/42a59222cf1f748a4e29e01d1632fa8c54708e93))


### Features

* **core:** create version 2 header switching to uint32 for block offsets ([#179](https://github.com/linz/cotar/issues/179)) ([a968a11](https://github.com/linz/cotar/commit/a968a11316153326702711274318b081a2149658))





## [5.1.1](https://github.com/linz/cotar/compare/v5.1.0...v5.1.1) (2021-11-29)

**Note:** Version bump only for package @cotar/core





# [5.1.0](https://github.com/linz/cotar/compare/v5.0.1...v5.1.0) (2021-11-29)


### Bug Fixes

* **core:** ignore gnutar's extra field types ([e1d3d14](https://github.com/linz/cotar/commit/e1d3d14a3e99da48eba66fe78abfbc182715059a))
* **core:** TarHeader.type can be "0" or 0x00 for regular files ([9185225](https://github.com/linz/cotar/commit/9185225adc06e101d7dd99cb61faacdb3fd867c4))


### Features

* **core:** support customising the search count and packing factor ([d1a1f2a](https://github.com/linz/cotar/commit/d1a1f2a2923377d9ed6e0bb2ff0125d4c009bcce))
* **core:** support hard links to dedupe data ([ba573a1](https://github.com/linz/cotar/commit/ba573a1b761118b6754f91b582a558745ec4d366))
* **tar:** create tars while deduping duplicate files ([#126](https://github.com/linz/cotar/issues/126)) ([ca8e419](https://github.com/linz/cotar/commit/ca8e419d40ffe7833d87d425a94b0caaf5cf470b))


### Performance Improvements

* only read the tar header parts that are needed ([6d9429d](https://github.com/linz/cotar/commit/6d9429d05f5747c323898f883e2cdff404b6df13))





## [5.0.1](https://github.com/linz/cotar/compare/v5.0.0...v5.0.1) (2021-09-16)


### Bug Fixes

* remove unused any ([88b2b06](https://github.com/linz/cotar/commit/88b2b06f2f5a5ca545794e2e2d9a95d615f00a4f))





# [5.0.0](https://github.com/linz/cotar/compare/v4.0.0...v5.0.0) (2021-09-16)


### Features

* switch to chunkd v7 which uses a dataview based interface ([ddc62bf](https://github.com/linz/cotar/commit/ddc62bf017e92616e7e01b642c2581bc4abbc33e))
* switch to esm modules ([5df415a](https://github.com/linz/cotar/commit/5df415a4b3668922f5e179fd371260482dd2238f))


### BREAKING CHANGES

* Switched to ESM modules this breaks all compatability
with CommonJS modules





# [4.0.0](https://github.com/linz/cotar/compare/v3.1.0...v4.0.0) (2021-07-23)


### Features

* **core:** append index onto tar file to create a single ".tar.co" file ([#48](https://github.com/linz/cotar/issues/48)) ([a4becec](https://github.com/linz/cotar/commit/a4becec897b012fd279a80041a59e6bb52ac5c42))
* **core:** remove ndjson index and just use a binary index ([#45](https://github.com/linz/cotar/issues/45)) ([5836d67](https://github.com/linz/cotar/commit/5836d67197224ffd5b2a88abae10acdf2bdf9be4))


### BREAKING CHANGES

* **core:** this changes both how the index is constructed and how it is stored

* refactor: rename index creator

* refactor: fix lint issues

* refactor: remove unused code

* test: adding tests for converting bigint to number





# [3.1.0](https://github.com/linz/cotar/compare/v3.0.0...v3.1.0) (2021-07-07)


### Bug Fixes

* **core:** break early if a empty slot in the hash map is empty ([#30](https://github.com/linz/cotar/issues/30)) ([b0727c3](https://github.com/linz/cotar/commit/b0727c34e70252203246bfd33953657f0216ebd1))


### Features

* **core:** simplify index building with CotarIndexBuilder ([#29](https://github.com/linz/cotar/issues/29)) ([d53c29d](https://github.com/linz/cotar/commit/d53c29d6c9c202c877dbcbfc380dcf498366a65d))





# [3.0.0](https://github.com/linz/cotar/compare/v2.0.0...v3.0.0) (2021-06-23)


### Features

* create a hash table binary index ([#27](https://github.com/linz/cotar/issues/27)) ([ee57594](https://github.com/linz/cotar/commit/ee57594ef39db92537d019fe87db42f1fa5e6c52))





# [2.0.0](https://github.com/linz/cotar/compare/v1.5.0...v2.0.0) (2021-06-16)


### Features

* **core:** switch to ndjson for the index format ([#24](https://github.com/linz/cotar/issues/24)) ([8edad7b](https://github.com/linz/cotar/commit/8edad7bf3dc901a183170f033fdb311f30617998))


### BREAKING CHANGES

* **core:** this switches from a json index file to a NDJSON index file, the primary driver is performance when working with largeish indexes 500,000+ records the parsing of the JSON is taking multiple seconds in a lambda function. By switching to a NDJSON on the lines that need to be parsed are which greatly reduces the inital load time of a cotar

* docs: add more method docs

* refactor: remove unused imports





# [1.5.0](https://github.com/linz/cotar/compare/v1.4.1...v1.5.0) (2021-06-09)


### Features

* **core:** expose api to create tar index from @cotar/core ([#23](https://github.com/linz/cotar/issues/23)) ([2a47b79](https://github.com/linz/cotar/commit/2a47b79cbfcd503613ec1b05db854c9084345476))





## [1.4.1](https://github.com/linz/cotar/compare/v1.4.0...v1.4.1) (2021-04-07)


### Bug Fixes

* **core:** adding missing binparse dep ([01d8216](https://github.com/linz/cotar/commit/01d82169bcdfbb37cc468e23eccb04905557ad53))
* **core:** store start of file offset not end ([b426d68](https://github.com/linz/cotar/commit/b426d6805858ffe4db18ae81c3f2526191ab473e))





# [1.4.0](https://github.com/linz/cotar/compare/v1.3.0...v1.4.0) (2021-04-07)


### Features

* **core:** index loading can now be synchronous ([752f57f](https://github.com/linz/cotar/commit/752f57f9301857d9987803d8bc44114e121a33b1))





# [1.3.0](https://github.com/linz/cotar/compare/v1.2.0...v1.3.0) (2021-04-07)


### Features

* **core:** expose tar header reader in @cotar/core ([07693ea](https://github.com/linz/cotar/commit/07693ea0833dc442d12f7696faaaa39809718571))





# [1.2.0](https://github.com/linz/cotar/compare/v1.1.0...v1.2.0) (2021-04-07)


### Bug Fixes

* **cli:** always store pbf tiles compressed ([2ea804d](https://github.com/linz/cotar/commit/2ea804d00f5d19e2d672e4aa6ad35709221429ec))


### Features

* simple tar server ([#7](https://github.com/linz/cotar/issues/7)) ([ebcfe2f](https://github.com/linz/cotar/commit/ebcfe2f67a5334c72f5a76ee83101e8b2c845415))
* **cli:** adding info/validate command ([#6](https://github.com/linz/cotar/issues/6)) ([498f84a](https://github.com/linz/cotar/commit/498f84a7a04fc1b043ffb067e8cb388b94777982))
* **core:** make covt more generic as it is for any file not just tiles ([7779cf2](https://github.com/linz/cotar/commit/7779cf266ba07a92d1dc1b3b1ac393ad5c5440b5))





# [1.1.0](https://github.com/blacha/covt/compare/v1.0.1...v1.1.0) (2021-03-25)


### Features

* **core:** adding basic tar reader ([254b151](https://github.com/blacha/covt/commit/254b1514c8bdc3b39063a1948366f70adf1c22fc))
