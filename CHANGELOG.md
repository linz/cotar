# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.0.1](https://github.com/linz/cotar/compare/v5.0.0...v5.0.1) (2021-09-16)


### Bug Fixes

* correct deployment logic for npm ([4fe1152](https://github.com/linz/cotar/commit/4fe1152be1c7f18472240e761be3a8de32c3f0bb))
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

* **cli:** support more types inside of tar ([19a088b](https://github.com/linz/cotar/commit/19a088b6195d44ec19b0bbe5706f777bcabec337))
* **core:** expose tar header reader in @cotar/core ([07693ea](https://github.com/linz/cotar/commit/07693ea0833dc442d12f7696faaaa39809718571))





# [1.2.0](https://github.com/linz/cotar/compare/v1.1.0...v1.2.0) (2021-04-07)


### Bug Fixes

* **cli:** always store pbf tiles compressed ([2ea804d](https://github.com/linz/cotar/commit/2ea804d00f5d19e2d672e4aa6ad35709221429ec))
* **cli:** mbtiles have inverted y axis ([8803da5](https://github.com/linz/cotar/commit/8803da55016e48124d8cea40a7cd2ff3f1afe5bb))
* missing bin/covt executable ([7eed3c9](https://github.com/linz/cotar/commit/7eed3c9fea053f66827130cd4ffc0e286f0263f1))


### Features

* simple tar server ([#7](https://github.com/linz/cotar/issues/7)) ([ebcfe2f](https://github.com/linz/cotar/commit/ebcfe2f67a5334c72f5a76ee83101e8b2c845415))
* **cli:** add ability to limit tar creation size ([a5246e4](https://github.com/linz/cotar/commit/a5246e43768d6c617f7d42e41eb07a4592f7dcbc))
* **cli:** adding info/validate command ([#6](https://github.com/linz/cotar/issues/6)) ([498f84a](https://github.com/linz/cotar/commit/498f84a7a04fc1b043ffb067e8cb388b94777982))
* **core:** make covt more generic as it is for any file not just tiles ([7779cf2](https://github.com/linz/cotar/commit/7779cf266ba07a92d1dc1b3b1ac393ad5c5440b5))





# [1.1.0](https://github.com/blacha/covt/compare/v1.0.1...v1.1.0) (2021-03-25)


### Features

* **core:** adding basic tar reader ([254b151](https://github.com/blacha/covt/commit/254b1514c8bdc3b39063a1948366f70adf1c22fc))
