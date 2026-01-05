import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loggerService } from "./logger.service";

describe("loggerService", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe("success", () => {
    it("应该输出成功消息", () => {
      loggerService.success("Test success message");
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it("应该支持加粗", () => {
      loggerService.success("Test message", true);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("warn", () => {
    it("应该输出警告消息", () => {
      loggerService.warn("Test warning message");
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it("应该支持加粗", () => {
      loggerService.warn("Test message", true);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("error", () => {
    it("应该输出错误消息", () => {
      loggerService.error("Test error message");
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it("应该支持加粗", () => {
      loggerService.error("Test message", true);
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("finish", () => {
    it("应该输出完成消息", () => {
      loggerService.finish("init");
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("init done."),
      );
    });
  });
});
