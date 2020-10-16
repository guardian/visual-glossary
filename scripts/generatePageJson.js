import * as fsBase from 'fs';
const fs = fsBase.promises;
import empty from 'empty-folder';
import puppeteer from 'puppeteer';
import fullPageScreenshot from 'puppeteer-full-page-screenshot';
import { autoScroll } from './autoScroll';

const rootPath1 = 'https://www.theguardian.com';
const rootPath2 = 'https://amp.theguardian.com';

const getPage = async (pageObj) => {
	// 1. Spin up a puppeteer page
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	await page.setViewport({ width: 400, height: 2000 });
	await page.goto(rootPath1 + '/' + pageObj.path, {
		waitUntil: 'networkidle0',
		timeout: 60000,
	});

	// Close consent
	await page.addStyleTag({
		content:
			'[id*="sp_message_container"],.site-message--banner{display: none !important}',
	});

	// 1.5 Get the text
	const headline = await page.evaluate(
		() =>
			Array.from(
				document.querySelectorAll('h1'),
				(element) => element.textContent,
			)[0],
	);

	const date = await page.evaluate(
		() =>
			Array.from(
				document.querySelectorAll('.content__dateline-wpd'),
				(element) => element.textContent,
			)[0],
	);

	const key = (() => {
		const a = headline.toLowerCase(); // Lowercase
		const b = a.replace(/[.,\/#!?$%\^&\*;:{}=\-_`~()]/g, ''); // Remove punctation
		const c = b.replace(/ +?/g, ''); // Remove all spaces
		return c;
	})();

	// 1.75 Scroll the page to load everything and then scroll to the top for screen 1
	await autoScroll(page);
	await page.evaluate(async () => {
		window.scrollTo(0, 0);
	});

	// 2. Take a screenshot and write it to dist
	console.log('Taking a screenshot');
	await fullPageScreenshot(page, {
		path: `./dist/img/${key}-1.png`,
	});

	// Do it all again
	await page.goto(rootPath2 + '/' + pageObj.path, {
		waitUntil: 'networkidle0',
		timeout: 60000,
	});

	// Close consent
	await page.addStyleTag({
		content:
			'[id*="sp_message_container"],.site-message--banner{display: none !important}',
	});

	await autoScroll(page);
	await page.evaluate(async () => {
		window.scrollTo(0, 0);
	});

	// 2. Take a screenshot and write it to dist
	console.log('Taking a screenshot');
	await fullPageScreenshot(page, {
		path: `./dist/img/${key}-2.png`,
	});

	// 3. Build up the json

	// {
	// 	"headline": "Test Headline",
	// 	"path": "testPath/test",
	// 	"key": "testheadline",
	// 	"date": "Tue 13 Oct 2020 10.00 BST",
	// 	"notes": "This one has modification to the body"
	//   }

	const json = {
		headline,
		date,
		key,
		path: pageObj.path,
		notes: pageObj.notes,
	};

	// 4. Close browser
	await browser.close();

	return json;
};

const init = async () => {
	// 0. Setup dist folder
	await new Promise((resolve, reject) => {
		empty('./dist', false, (o) => {
			if (o.error) {
				console.error(o.error);
				reject();
			}
			resolve();
		});
	});

	await fs.mkdir('./dist/img');

	// 1. Get the paths json
	const pathsFile = await fs.readFile('./data/paths.json');

	const paths = JSON.parse(pathsFile);
	console.log(paths);

	// 2. Loop over paths json and build page.json
	const pagesJson = await Promise.all(paths.map(getPage));

	// 3. Create the json with the defaults
	const json = {
		pageTitle: 'Interactive pages',
		description: 'Working through interactive pages',
		rootPath1,
		rootPath2,
		pages: pagesJson,
	};
	// 4. Write the json to dist
	console.log(json);
	await fs.writeFile(
		'./dist/pages.json',
		JSON.stringify(json),
		(e) => console.log,
	);
};

init();
