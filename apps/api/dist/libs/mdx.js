"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMdxFileCount = exports.loadMdxFiles = void 0;
const gray_matter_1 = __importDefault(require("gray-matter"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const remark_1 = require("remark");
const remark_gfm_1 = __importDefault(require("remark-gfm"));
const remark_mdx_1 = __importDefault(require("remark-mdx"));
const remark_parse_1 = __importDefault(require("remark-parse"));
const loadMdxFiles = (slug) => {
    const dirPath = node_path_1.default.join(process.cwd(), "src", "contents", slug);
    if (!node_fs_1.default.existsSync(dirPath)) {
        return [];
    }
    const files = node_fs_1.default.readdirSync(dirPath);
    const contents = files.map((file) => {
        const filePath = node_path_1.default.join(dirPath, file);
        const source = node_fs_1.default.readFileSync(filePath, "utf-8");
        const { content, data } = (0, gray_matter_1.default)(source);
        const mdxCompiler = (0, remark_1.remark)().use(remark_parse_1.default).use(remark_gfm_1.default).use(remark_mdx_1.default);
        const mdxContent = mdxCompiler.processSync(content).toString();
        return {
            slug: file.replace(".mdx", ""),
            frontMatter: data,
            content: mdxContent,
        };
    });
    return contents;
};
exports.loadMdxFiles = loadMdxFiles;
const getMdxFileCount = (slug) => {
    const dirPath = node_path_1.default.join(process.cwd(), "src", "contents", slug);
    const files = node_fs_1.default.readdirSync(dirPath);
    const mdxFiles = files.filter((file) => file.endsWith(".mdx"));
    return mdxFiles.length;
};
exports.getMdxFileCount = getMdxFileCount;
