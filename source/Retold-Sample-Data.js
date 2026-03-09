const libFableServiceProviderBase = require('fable-serviceproviderbase');
const libPath = require('path');
const libFS = require('fs');

class RetoldSampleData extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'RetoldSampleData';
	}

	/**
	 * Get the base path for the bookstore schema files.
	 *
	 * @returns {string} Absolute path to the bookstore schema directory
	 */
	getBookstoreSchemaPath()
	{
		return libPath.join(__dirname, 'schemas', 'bookstore');
	}

	/**
	 * Get the parsed MeadowModel.json for the bookstore.
	 *
	 * @returns {object} The MeadowModel definition
	 */
	getMeadowModel()
	{
		let tmpModelPath = libPath.join(this.getBookstoreSchemaPath(), 'MeadowModel.json');
		return JSON.parse(libFS.readFileSync(tmpModelPath, 'utf8'));
	}

	/**
	 * Get the parsed Schema.json for the bookstore.
	 *
	 * @returns {object} The full Schema definition (used by RetoldDataService)
	 */
	getSchema()
	{
		let tmpSchemaPath = libPath.join(this.getBookstoreSchemaPath(), 'Schema.json');
		return JSON.parse(libFS.readFileSync(tmpSchemaPath, 'utf8'));
	}

	/**
	 * Get the SQLite DDL for the bookstore.
	 *
	 * @returns {string} The CREATE TABLE SQL statements
	 */
	getSQLiteDDL()
	{
		let tmpDDLPath = libPath.join(this.getBookstoreSchemaPath(), 'sqlite_create', 'BookStore-CreateSQLiteTables.sql');
		return libFS.readFileSync(tmpDDLPath, 'utf8');
	}

	/**
	 * Get the seed data SQL for the bookstore.
	 *
	 * @returns {string} The INSERT SQL statements for seed data
	 */
	getSeedDataSQL()
	{
		let tmpSeedPath = libPath.join(this.getBookstoreSchemaPath(), 'sqlite_create', 'BookStore-SeedData.sql');
		return libFS.readFileSync(tmpSeedPath, 'utf8');
	}

	/**
	 * Get a parsed individual Meadow schema JSON for an entity.
	 *
	 * @param {string} pEntityName - The entity name (e.g. 'Book', 'Customer')
	 * @returns {object} The Meadow schema definition
	 */
	getMeadowSchema(pEntityName)
	{
		let tmpSchemaPath = libPath.join(this.getBookstoreSchemaPath(), 'meadow', `MeadowSchema${pEntityName}.json`);
		return JSON.parse(libFS.readFileSync(tmpSchemaPath, 'utf8'));
	}

	/**
	 * List all available entity names in the bookstore schema.
	 *
	 * @returns {Array<string>} Array of entity names
	 */
	getEntityList()
	{
		let tmpModel = this.getMeadowModel();
		return Object.keys(tmpModel.Tables);
	}
}

module.exports = RetoldSampleData;
module.exports.default_configuration = {};
module.exports.ServiceType = 'RetoldSampleData';
