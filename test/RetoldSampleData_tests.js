const libChai = require('chai');
const libExpect = libChai.expect;
const libFable = require('fable');
const libRetoldSampleData = require('../source/Retold-Sample-Data.js');

const _Fable = new libFable({});

suite
(
	'Retold Sample Data',
	() =>
	{
		let _SampleData = null;

		setup(() =>
		{
			_Fable.serviceManager.addServiceType('RetoldSampleData', libRetoldSampleData);
			_SampleData = _Fable.serviceManager.instantiateServiceProvider('RetoldSampleData');
		});

		test
		(
			'RetoldSampleData class should exist',
			(fDone) =>
			{
				libExpect(libRetoldSampleData).to.be.a('function');
				return fDone();
			}
		);

		test
		(
			'RetoldSampleData instance should have been created',
			(fDone) =>
			{
				libExpect(_SampleData).to.be.an('object');
				libExpect(_SampleData.serviceType).to.equal('RetoldSampleData');
				return fDone();
			}
		);

		test
		(
			'Should return the bookstore schema path',
			(fDone) =>
			{
				let tmpPath = _SampleData.getBookstoreSchemaPath();
				libExpect(tmpPath).to.be.a('string');
				libExpect(tmpPath).to.contain('bookstore');
				return fDone();
			}
		);

		test
		(
			'Should return the entity list with 12 entities',
			(fDone) =>
			{
				let tmpEntityList = _SampleData.getEntityList();
				libExpect(tmpEntityList).to.be.an('array');
				libExpect(tmpEntityList).to.have.lengthOf(12);
				libExpect(tmpEntityList).to.include('Customer');
				libExpect(tmpEntityList).to.include('User');
				libExpect(tmpEntityList).to.include('Book');
				libExpect(tmpEntityList).to.include('Author');
				libExpect(tmpEntityList).to.include('BookAuthorJoin');
				libExpect(tmpEntityList).to.include('BookPrice');
				libExpect(tmpEntityList).to.include('BookStore');
				libExpect(tmpEntityList).to.include('BookStoreInventory');
				libExpect(tmpEntityList).to.include('BookStoreEmployee');
				libExpect(tmpEntityList).to.include('BookStoreSale');
				libExpect(tmpEntityList).to.include('BookStoreSaleItem');
				libExpect(tmpEntityList).to.include('Review');
				return fDone();
			}
		);

		test
		(
			'Should load MeadowModel.json',
			(fDone) =>
			{
				let tmpModel = _SampleData.getMeadowModel();
				libExpect(tmpModel).to.be.an('object');
				libExpect(tmpModel).to.have.property('Tables');
				libExpect(Object.keys(tmpModel.Tables)).to.have.lengthOf(12);
				return fDone();
			}
		);

		test
		(
			'Should load Schema.json',
			(fDone) =>
			{
				let tmpSchema = _SampleData.getSchema();
				libExpect(tmpSchema).to.be.an('object');
				libExpect(tmpSchema).to.have.property('TablesSequence');
				libExpect(tmpSchema.TablesSequence).to.have.lengthOf(12);
				return fDone();
			}
		);

		test
		(
			'Should load SQLite DDL',
			(fDone) =>
			{
				let tmpDDL = _SampleData.getSQLiteDDL();
				libExpect(tmpDDL).to.be.a('string');
				libExpect(tmpDDL).to.contain('CREATE TABLE IF NOT EXISTS Customer');
				libExpect(tmpDDL).to.contain('CREATE TABLE IF NOT EXISTS Book');
				libExpect(tmpDDL).to.contain('CREATE TABLE IF NOT EXISTS BookStoreEmployee');
				libExpect(tmpDDL).to.contain('IDCustomer');
				return fDone();
			}
		);

		test
		(
			'Should load seed data SQL',
			(fDone) =>
			{
				let tmpSeed = _SampleData.getSeedDataSQL();
				libExpect(tmpSeed).to.be.a('string');
				libExpect(tmpSeed).to.contain('INSERT INTO');
				return fDone();
			}
		);

		test
		(
			'Should load individual Meadow schema for Book',
			(fDone) =>
			{
				let tmpSchema = _SampleData.getMeadowSchema('Book');
				libExpect(tmpSchema).to.be.an('object');
				libExpect(tmpSchema).to.have.property('Scope', 'Book');
				libExpect(tmpSchema).to.have.property('DefaultIdentifier', 'IDBook');
				libExpect(tmpSchema).to.have.property('Schema');
				libExpect(tmpSchema).to.have.property('Authorization');
				return fDone();
			}
		);

		test
		(
			'Should load individual Meadow schema for Customer',
			(fDone) =>
			{
				let tmpSchema = _SampleData.getMeadowSchema('Customer');
				libExpect(tmpSchema).to.be.an('object');
				libExpect(tmpSchema).to.have.property('Scope', 'Customer');
				libExpect(tmpSchema).to.have.property('DefaultIdentifier', 'IDCustomer');
				return fDone();
			}
		);

		test
		(
			'All entities should have IDCustomer in their Meadow schema',
			(fDone) =>
			{
				let tmpEntityList = _SampleData.getEntityList();
				for (let i = 0; i < tmpEntityList.length; i++)
				{
					let tmpSchema = _SampleData.getMeadowSchema(tmpEntityList[i]);
					let tmpColumns = tmpSchema.Schema.map((pCol) => pCol.Column);
					libExpect(tmpColumns).to.include('IDCustomer',
						`${tmpEntityList[i]} should have IDCustomer`);
				}
				return fDone();
			}
		);
	}
);
