"use strict";
// Copyright (c) Jan-Otto Kröpke
// Licensed under the MIT license.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const util = __importStar(require("util"));
const fs = __importStar(require("fs"));
const semver = __importStar(require("semver"));
const toolCache = __importStar(require("@actions/tool-cache"));
const core = __importStar(require("@actions/core"));
const valsToolName = 'vals';
const stableValsVersion = 'v0.18.0';
const valsAllReleasesUrl = 'https://api.github.com/repos/variantdev/vals/releases';
function getExecutableExtension() {
    if (os.type().match(/^Win/)) {
        return '.exe';
    }
    return '';
}
function getValsDownloadURL(version) {
    if (version.toLocaleLowerCase().startsWith('v')) {
        version = version.substring(1);
    }
    switch (os.type()) {
        case 'Linux':
            return util.format('https://github.com/variantdev/vals/releases/download/v%s/vals_%s_linux_amd64.tar.gz', version, version);
        case 'Darwin':
            return util.format('https://github.com/variantdev/vals/releases/download/v%s/vals_%s_darwin_amd64.tar.gz', version, version);
        case 'Windows_NT':
            return util.format('https://github.com/variantdev/vals/releases/download/v%s/vals_%s_windows_amd64.tar.gz', version, version);
        default:
            throw new Error(util.format('vals does not provide %s binaries.', os.type()));
    }
}
function getStableValsVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const downloadPath = yield toolCache.downloadTool(valsAllReleasesUrl);
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
        }
        catch (error) {
            core.warning(util.format("Cannot get the latest vals info from %s. Error %s. Using default vals version %s.", valsAllReleasesUrl, error, stableValsVersion));
        }
        return stableValsVersion;
    });
}
const walkSync = function (dir, fileList, fileToFind) {
    const files = fs.readdirSync(dir);
    fileList = fileList || [];
    files.forEach(function (file) {
        if (fs.statSync(path.join(dir, file)).isDirectory()) {
            fileList = walkSync(path.join(dir, file), fileList, fileToFind);
        }
        else {
            core.debug(file);
            if (file == fileToFind) {
                fileList.push(path.join(dir, file));
            }
        }
    });
    return fileList;
};
function downloadVals(version) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!version) {
            version = yield getStableValsVersion();
        }
        let cachedToolPath = toolCache.find(valsToolName, version);
        if (!cachedToolPath) {
            let valsDownloadPath;
            try {
                valsDownloadPath = yield toolCache.downloadTool(getValsDownloadURL(version));
            }
            catch (exception) {
                throw new Error(util.format("Failed to download vals from location ", getValsDownloadURL(version)));
            }
            const valsExtractedFolder = yield toolCache.extractTar(valsDownloadPath);
            fs.chmodSync(valsExtractedFolder, '777');
            cachedToolPath = yield toolCache.cacheFile(valsExtractedFolder + '/' + valsToolName + getExecutableExtension(), valsToolName + getExecutableExtension(), valsToolName, version);
        }
        const valsPath = findVals(cachedToolPath);
        if (!valsPath) {
            throw new Error(util.format("vals executable not found in path ", cachedToolPath));
        }
        fs.chmodSync(valsPath, '777');
        return valsPath;
    });
}
function findVals(rootFolder) {
    fs.chmodSync(rootFolder, '777');
    const fileList = [];
    walkSync(rootFolder, fileList, valsToolName + getExecutableExtension());
    if (!fileList) {
        throw new Error(util.format("Vals executable not found in path ", rootFolder));
    }
    else {
        return fileList[0];
    }
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let version = core.getInput('version', { 'required': true });
        if (version.toLocaleLowerCase() === 'latest') {
            version = yield getStableValsVersion();
        }
        else if (!version.toLocaleLowerCase().startsWith('v')) {
            version = 'v' + version;
        }
        let cachedPath = yield downloadVals(version);
        try {
            if (!process.env['PATH'].startsWith(path.dirname(cachedPath))) {
                core.addPath(path.dirname(cachedPath));
            }
        }
        catch (_a) {
            //do nothing, set as output variable
        }
        console.log(`Vals tool version: '${version}' has been cached at ${cachedPath}`);
        core.setOutput('vals-path', cachedPath);
    });
}
run().catch(core.setFailed);
