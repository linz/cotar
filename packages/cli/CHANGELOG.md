# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
