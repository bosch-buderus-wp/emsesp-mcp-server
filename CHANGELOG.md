# Changelog

All notable changes to this project will be documented in this file.

## [1.1.1] - 2025-07-17

### Added

- **Prompts support**: New MCP prompts functionality with prompts for heat curve visualization and domestic hot water settings as a table
- Enables the server to be executed via `npx` for easier setup and use.
- Introduces a configuration option for the EMS-ESP URL in DXT file

### Changed

- **Test organization**: Renamed integration test files for better clarity
  - `test/integration.test.ts` renamed to `test/tools.int.test.ts`
  - Added new `test/prompts.int.test.ts` for prompt-specific tests

### Fixed

- Enhanced URL validation: Improved EMS-ESP URL validation with better error messages and protocol checking
- Improved GitHub Actions workflow for package and release process
- Enhanced build process to include dist folder in DXT file

## [1.0.0] - 2025-07-11

- Initial version of the EMSESP MCP Server with various tools to retrieve entities from Bosch/Buderus heat pumps
- DXT file for quick installation in Claude Desktop
