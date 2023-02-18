// Copyright (c) Jan-Otto Kröpke
// Licensed under the MIT license.

import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import * as fs from 'fs';
import * as semver from 'semver';

import * as toolCache from '@actions/tool-cache';
import * as core from '@actions/core';

const valsToolName = 'vals';
const stableValsVersion = 'v0.18.0';
const valsAllReleasesUrl = 'https://api.github.com/repos/variantdev/vals/releases';

function getExecutableExtension(): string {
    if (os.type().match(/^Win/)) {
        return '.exe';
    }
    return '';
}

function getValsDownloadURL(version: string): string {
    if (version.toLocaleLowerCase().startsWith('v')) {
        version = version.substring(1);
    }

    switch (os.type()) {
        case 'Linux':
            return util.format('https://github.com/helmfile/vals/releases/download/v%s/vals_%s_linux_amd64.tar.gz', version, version);

        case 'Darwin':
            return util.format('https://github.com/helmfile/vals/releases/download/v%s/vals_%s_darwin_amd64.tar.gz', version, version);

        case 'Windows_NT':
            return util.format('https://github.com/helmfile/vals/releases/download/v%s/vals_%s_windows_amd64.tar.gz', version, version);

        default:
            throw new Error(util.format('vals does not provide %s binaries.', os.type()));
    }
}

async function getStableValsVersion(): Promise<string> {
    try {
        const downloadPath = await toolCache.downloadTool(valsAllReleasesUrl);
        const responseArray = JSON.parse(fs.readFileSync(downloadPath, 'utf8').toString().trim());
        let latestValsVersion = semver.clean(stableValsVersion);
        responseArray.forEach(response => {
            if (response && response.tag_name) {
                let currentValsVersion = semver.clean(response.tag_name.toString());
                if (currentValsVersion) {
                    if (currentValsVersion.toString().indexOf('rc') == -1 && semver.gt(currentValsVersion, latestValsVersion)) {
                        //If a current vals version is not a pre-release and is greater the latest vals version
                        latestValsVersion = currentValsVersion;
                    }
                }
            }
        });
        latestValsVersion = "v" + latestValsVersion;
        return latestValsVersion;
    } catch (error) {
        core.warning(util.format("Cannot get the latest vals info from %s. Error %s. Using default vals version %s.", valsAllReleasesUrl, error, stableValsVersion));
    }

    return stableValsVersion;
}


const walkSync = function (dir, fileList, fileToFind) {
    const files = fs.readdirSync(dir);
    fileList = fileList || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            fileList = walkSync(path.join(dir, file), fileList, fileToFind);
        } else {
            core.debug(file);
            if (file == fileToFind) {
                fileList.push(path.join(dir, file));
            }
        }
    });
    return fileList;
};

async function downloadVals(version: string): Promise<string> {
    if (!version) { version = await getStableValsVersion(); }
    let cachedToolPath = toolCache.find(valsToolName, version);
    if (!cachedToolPath) {
        let valsDownloadPath;
        try {
            valsDownloadPath = await toolCache.downloadTool(getValsDownloadURL(version));
        } catch (exception) {
            throw new Error(util.format("Failed to download vals from location ", getValsDownloadURL(version)));
        }

        const valsExtractedFolder = await toolCache.extractTar(valsDownloadPath);

        fs.chmodSync(valsExtractedFolder, '777');

        cachedToolPath = await toolCache.cacheFile(valsExtractedFolder + '/' + valsToolName + getExecutableExtension(), valsToolName + getExecutableExtension(), valsToolName, version);
    }

    const valsPath = findVals(cachedToolPath);
    if (!valsPath) {
        throw new Error(util.format("vals executable not found in path ", cachedToolPath));
    }

    fs.chmodSync(valsPath, '777');
    return valsPath;
}

function findVals(rootFolder: string): string {
    fs.chmodSync(rootFolder, '777');
    const fileList: string[] = [];
    walkSync(rootFolder, fileList, valsToolName + getExecutableExtension());
    if (!fileList) {
        throw new Error(util.format("Vals executable not found in path ", rootFolder));
    }
    else {
        return fileList[0];
    }
}

async function run() {
    let version = core.getInput('version', { 'required': true });
    if (version.toLocaleLowerCase() === 'latest') {
        version = await getStableValsVersion();
    } else if (!version.toLocaleLowerCase().startsWith('v')) {
        version = 'v' + version;
    }

    let cachedPath = await downloadVals(version);

    try {
        if (!process.env['PATH'].startsWith(path.dirname(cachedPath))) {
            core.addPath(path.dirname(cachedPath));
        }
    }
    catch {
        //do nothing, set as output variable
    }

    console.log(`Vals tool version: '${version}' has been cached at ${cachedPath}`);
    core.setOutput('vals-path', cachedPath);
}

run().catch(core.setFailed);
