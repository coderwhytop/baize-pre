import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { toolService } from "./tool.service";

describe("toolService", () => {
  describe("isObject", () => {
    it("应该正确识别对象", () => {
      expect(toolService.isObject({})).toBe(true);
      expect(toolService.isObject({ a: 1 })).toBe(true);
      expect(toolService.isObject([])).toBe(false);
      expect(toolService.isObject(null)).toBe(false);
      expect(toolService.isObject(undefined)).toBe(false);
      expect(toolService.isObject("string")).toBe(false);
      expect(toolService.isObject(123)).toBe(false);
    });
  });

  describe("formatJSON", () => {
    it("应该正确格式化 JSON", () => {
      const obj = { name: "test", version: "1.0.0" };
      const formatted = toolService.formatJSON(obj);
      expect(formatted).toContain('"name": "test"');
      expect(formatted).toContain('"version": "1.0.0"');
      expect(() => JSON.parse(formatted)).not.toThrow();
    });

    it("应该使用 2 空格缩进", () => {
      const obj = { a: 1, b: { c: 2 } };
      const formatted = toolService.formatJSON(obj);
      const lines = formatted.split("\n");
      expect(lines[1]).toMatch(/^ {2}"/);
    });
  });

  describe("writeJSONFileSync", () => {
    it("应该正确写入 JSON 文件", () => {
      const testFile = path.join(tmpdir(), `test-${Date.now()}.json`);
      const testData = { name: "test", value: 123 };

      toolService.writeJSONFileSync(testFile, testData);

      expect(fs.existsSync(testFile)).toBe(true);

      const content = fs.readFileSync(testFile, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(testData);

      // 清理
      fs.unlinkSync(testFile);
    });

    it("应该覆盖已存在的文件", () => {
      const testFile = path.join(tmpdir(), `test-${Date.now()}.json`);
      const oldData = { old: "data" };
      const newData = { new: "data" };

      toolService.writeJSONFileSync(testFile, oldData);
      toolService.writeJSONFileSync(testFile, newData);

      const content = fs.readFileSync(testFile, "utf-8");
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(newData);
      expect(parsed).not.toEqual(oldData);

      // 清理
      fs.unlinkSync(testFile);
    });
  });
});
