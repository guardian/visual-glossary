import * as fsBase from 'fs';
const fs = fsBase.promises;
import * as path from 'path';
import { Liquid } from 'liquidjs';
// Build an html page

// Setup liquid
var engine = new Liquid({
	root: path.resolve(`./layouts`), // root for layouts/includes lookup
	extname: '.liquid', // used for layouts/includes, defaults ""
});

const generatePage = async () => {
	// 1. Get the JSON from the generated JSON file
	const pagesFile = await fs.readFile('./dist/pages.json');

	const pages = JSON.parse(pagesFile);

	// 2. Generate html page from JSON
	const html = await engine.renderFile('index', pages);

	// 3. Write to a file
	await fs.writeFile('./dist/index.html', html, (e) => console.log);
};

generatePage();
