const fs = require('fs');
const path = require('path');
const lassoUnpack = require('lasso-unpack');
const opener = require('opener');
const Tree = require('./tree');

function bundleAnalyzer(fileName, options) {
    // load lasso-unpack and create lasso-stats.json
    // unpack the bundle using lasso-unpack.
    lassoUnpack(fileName);
    const readFile = fs.readFileSync(path.resolve("lasso-stats.json"), 'utf8');
    const readJSON = JSON.parse(readFile);
    const bundleName = (options && options.bundleName) || 'lasso-analyze'
    if (readJSON.length > 0) {
        readJSON.shift()
    };
    const tree = new Tree('/');
    tree.setEnableColors(options && options.colors || false);
    readJSON.forEach((source) => {
        tree.createNode(source, tree, tree.isColorEnabled());
    });
    tree.createTile(tree, tree.data['$area']);
    const html = generateHTML(tree);
    fs.writeFileSync(getOutputHTML(bundleName), html);
    // open the browser with generated html
    opener(getOutputHTML(bundleName));
    // clean files
    cleanFiles();
};

function cleanFiles() {
    const jsFile = process.cwd() + '/lasso-analyze.js';
    const jsonFile = process.cwd() + '/lasso-stats.json';
    // remove bundle js
    if (fs.existsSync(jsFile)) {
        fs.unlinkSync(jsFile);
    }
    // remove lasso-stats.json
    if (fs.existsSync(jsonFile)) {
        fs.unlinkSync(jsonFile);
    }
}

function getOutputHTML(bundleName) {
    return process.cwd() + '/' + bundleName + ".html";
};

function generateHTML(tree) {
    let lassoHTML = fs.readFileSync(require.resolve('../static/lasso-analyze.html')).toString();
    // Insert webtreemap js in to lasso html.
    lassoHTML = replaceJS(lassoHTML);
    // Insert webtreemap css in to lasso html
    lassoHTML = replaceCSS(lassoHTML);
    lassoHTML = replaceTreeDate(lassoHTML, tree);
    return lassoHTML;
};

function replaceJS(lassoHTML) {
    const webtreeJs = fs.readFileSync(require.resolve('../static/webtreemap.js'), 'utf8');
    const data = '<script type="text/javascript">' + webtreeJs + '</script>';
    lassoHTML = lassoHTML.replace('<!-- @@WEBTREEMAPJS -->', data);
    return lassoHTML;
};

function replaceCSS(lassoHTML) {
    const webtreeCss = fs.readFileSync(require.resolve('../static/webtreemap.css'), 'utf8');
    lassoHTML = lassoHTML.replace('<!-- @@WEBTREEMAPCSS -->', webtreeCss);
    return lassoHTML;
};

function replaceTreeDate(lassoHTML, treeData) {
    const treeToString = JSON.stringify(treeData);
    return lassoHTML.replace('@@WEBTREEMAPDATA', treeToString);
}

module.exports = bundleAnalyzer;