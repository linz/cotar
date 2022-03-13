# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.2.0](https://github.com/linz/cotar/compare/v5.1.1...v5.2.0) (2022-03-13)


### Features

* **cli:** validate seperate index files ([#191](https://github.com/linz/cotar/issues/191)) ([8ced487](https://github.com/linz/cotar/commit/8ced48712963d2172229410c0809284592cf234f))





## [5.1.1](https://github.com/linz/cotar/compare/v5.1.0...v5.1.1) (2021-11-29)

**Note:** Version bump only for package @cotar/cli





# [5.1.0](https://github.com/linz/cotar/compare/v5.0.1...v5.1.0) (2021-11-29)


### Bug Fixes

* **cli:** correct import path ([2f9220b](https://github.com/linz/cotar/commit/2f9220b6662302b56c6491b4b50956e44a9f5886))
* **cli:** remove unused mbtiles command ([183dca8](https://github.com/linz/cotar/commit/183dca8c26b99809cef622cfa3974fd80349685b))


### Features

* **cli:** basic webserver for cotar using "cotar serve data.tar" ([7dbc06c](https://github.com/linz/cotar/commit/7dbc06c4c3835c191dd0c8d5c104ea5decda8972))
* **cli:** create a tree from the tar to make it easier to navigate ([14eea64](https://github.com/linz/cotar/commit/14eea643e182ff9944d71165c755e58b7057d11a))
* **cli:** laod the cotar file list into memory by default ([45ebfc1](https://github.com/linz/cotar/commit/45ebfc16e03c840ea47d7f83f92b6fc6044a5506))
* **cli:** support customising the port with baseUrl ([29049ec](https://github.com/linz/cotar/commit/29049ecfa36865cc619409ce1c22ad1182eb19cc))
* **cli:** use --base-url and --disable-index to be consitent ([70a33f7](https://github.com/linz/cotar/commit/70a33f77e24725d04f35cc185adf6f23430236f9))
* **core:** support customising the search count and packing factor ([d1a1f2a](https://github.com/linz/cotar/commit/d1a1f2a2923377d9ed6e0bb2ff0125d4c009bcce))





## [5.0.1](https://github.com/linz/cotar/compare/v5.0.0...v5.0.1) (2021-09-16)

**Note:** Version bump only for package @cotar/cli





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

**Note:** Version bump only for package @cotar/cli





# [1.4.0](https://github.com/linz/cotar/compare/v1.3.0...v1.4.0) (2021-04-07)

**Note:** Version bump only for package @cotar/cli





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

* **cli:** add ability to limit tar creation size ([a5246e4](https://github.com/linz/cotar/commit/a5246e43768d6c617f7d42e41eb07a4592f7dcbc))
* **cli:** adding info/validate command ([#6](https://github.com/linz/cotar/issues/6)) ([498f84a](https://github.com/linz/cotar/commit/498f84a7a04fc1b043ffb067e8cb388b94777982))





# [1.1.0](https://github.com/blacha/covt/compare/v1.0.1...v1.1.0) (2021-03-25)

**Note:** Version bump only for package @covt/cli
