`use strict`;

const commandLineArguments = require(`command-line-args`);

const definitions = [
	{
		name : `included-paths`, type : String, multiple : true
	},
	{
		name : `output-directory`, type : String
	},
	{
		name : `exclude-pattern`, type : String
	}
];

module.exports = commandLineArguments(definitions);
