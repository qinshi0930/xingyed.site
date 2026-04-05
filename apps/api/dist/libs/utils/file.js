"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSourceSync = exports.getSource = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const getSource = async (filename) => {
    const sourcePath = node_path_1.default.join(process.cwd(), "src", "lib", "seed", "data", filename);
    if (!node_fs_1.default.existsSync(sourcePath)) {
        console.error("the file is not exists, path: ", sourcePath);
        return;
    }
    try {
        return await node_fs_1.default.promises.readFile(sourcePath, "utf8");
    }
    catch (error) {
        console.error("Error reading file:", error);
    }
};
exports.getSource = getSource;
const getSourceSync = (filename) => {
    const sourcePath = node_path_1.default.join(process.cwd(), "src", "lib", "seed", "data", filename);
    if (!node_fs_1.default.existsSync(sourcePath))
        return;
    try {
        return node_fs_1.default.readFileSync(sourcePath, "utf8");
    }
    catch (error) {
        console.error("Error reading file:", error);
    }
};
exports.getSourceSync = getSourceSync;
