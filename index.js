#!/usr/bin/env node
`use strict`;

const fs               = require(`fs`);
const recursive        = require(`recursive-readdir`);
const markdown_table   = require(`markdown-table`);
const cl_arguments     = require(`./cl-args`);
const included_paths   = cl_arguments[`included-paths`];
const output_directory = cl_arguments[`output-directory`] || `.`;
const exclude_pattern  = cl_arguments[`exclude-pattern`] ? new RegExp(cl_arguments[`exclude-pattern`]) : false;

// Stores all the markdown data to be generated
const markdown_data      = [];

// Regex to get the class name
const class_regex        = /.*\/(.*)\.\s*/;

// Regex to get all docblocks in a file
const blocks_regex       = /\/\*\*\n([\s\S])+?\*\/\n.*/g;

// Regex to get single lines in a docblock
const single_block_regex = /\t\s*\*\s(.*)/g;

// Regex to get the method name
const method_regex       = /\*\/\n*\t*(.*)\(/;

// Regex to match a tag
const tag_regex          = /@(\w*)/

// Regex to match the argument type
const type_regex         = /@\w*\s*{(.*)}/;

// Regex to match the argument name
const name_regex         = /@\w*\s*{.*}\s*(\w*)\s/;

// Regex to match the description
const description_regex  = /@\w*\s*{.*}\s*\w*\s*(.*)/;

(async () => {
	// Go through all included paths
	for(let path of included_paths) {
		const files = fs.lstatSync(path).isDirectory() ? await recursive(path) : [path];

		// Recursively go through all files in the included paths
		for(let file of files) {
			// Ignore excluded directories or files
			if(exclude_pattern && exclude_pattern.test(file)) {
				continue;
			}

			// Cleaned up data from the file
			const file_data    = {};

			// Get the name of the file/class
			const class_name   = file.match(class_regex)[1];

			// Get the contents of the file
			const contents     = fs.readFileSync(file, `utf8`);

			// Get every block
			const blocks       = contents.match(blocks_regex) || [];

			file_data.class_name = class_name;
			file_data.blocks     = [];

			// Go through all blocks within a file
			for(let block of blocks) {
				const block_data = {};
				let match        = null;

				block_data.tags        = [];
				block_data.description = single_block_regex.exec(block)[1];
				block_data.method_name = method_regex.exec(block)[1];

				// Get lines in a docblock
				while(match = (single_block_regex.exec(block))) {
					const output = match[1];

					// Only grab valid tags
					if(!output.match(/^@/)) {
						continue;
					}

					// Add single line from the block
					block_data.tags.push(match[1]);
				}

				// Add the block data
				file_data.blocks.push(block_data);
			}

			// Push all data from the file to markdown
			markdown_data.push(file_data);
		}
	}

	// Build the markdown files
	for(let data of markdown_data) {
		const markdown_output = [];

		// Display the class name
		markdown_output.push(`# ${data.class_name}`);

		// Go through each block in a file
		for(let block of data.blocks) {
			markdown_output.push(`## ${data.class_name}.${block.method_name}`);
			markdown_output.push(block.description);

			// Headers for the argument table
			const argument_table = [[
				`Name`, `Type`, `Description`
			]];

			// Headers for the option table
			const option_table = [[
				`Argument`, `Name`, `Type`, `Description`
			]];

			// General tag data
			const general_table = [[
				`Tag`, `Type`, `Description`
			]];

			// Generate the argument table
			let last_argument = null;
			for(let tag of block.tags) {
				const argument = tag.match(/@param/);
				const option   = tag.match(/@option/);
				const matches  = {
					tag         : tag.match(tag_regex),
					type        : tag.match(type_regex),
					name        : tag.match(name_regex),
					description : tag.match(description_regex),
				};

				// Data for the table
				const display_tag = matches.tag ? matches.tag[1].replace(/@/, ``) : `N/A`;
				const name        = matches.name ? matches.name[1] : `N/A`;
				const type        = matches.type ? matches.type[1] : `N/A`;
				const description = matches.description ? matches.description[1] : `N/A`;

				// Check if arguments need to be added
				if(argument) {
					last_argument = name;

					argument_table.push([
						name, `\`${type}\``, description
					]);
				}

				// Check if options need to be added
				if(option) {
					option_table.push([
						last_argument, name, `\`${type}\``, description
					]);
				}

				// Check if general data needs to be added
				if(!option && !argument) {
					general_table.push([
						display_tag, `\`${type}\``, description
					]);
				}
			}

			// Generate the argument table
			if(argument_table.length > 1) {
				markdown_output.push(`### Arguments`, markdown_table(argument_table));
			}

			// Generate the options table
			if(option_table.length > 1) {
				markdown_output.push(`### Options`, markdown_table(option_table));
			}

			// Generate the general table
			if(general_table.length > 1) {
				markdown_output.push(`### General`, markdown_table(general_table));
			}
		}

		const output = markdown_output.join(`\n\n`);

		// Write the markdown to a file
		fs.writeFileSync(`${output_directory}/${data.class_name}.md`, output);
	}
})();
