// Tests for the checkURLActive port (serverUtils.js), including the new
// SSRF guard. DNS and fetch are mocked — no network access.

jest.mock("dns", () => ({
  promises: { lookup: jest.fn() },
}));
const dns = require("dns").promises;

const { checkURLActive, isSafeUrl } = require("../src/services/urlCheck");

const PUBLIC_ADDR = [{ address: "93.184.216.34", family: 4 }];

describe("checkURLActive", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("returns false for a missing URL", async () => {
    expect(await checkURLActive("")).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns true when the URL responds OK", async () => {
    dns.lookup.mockResolvedValue(PUBLIC_ADDR);
    fetch.mockResolvedValue({ ok: true, status: 200 });

    expect(await checkURLActive("https://example.com/data")).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/data",
      expect.objectContaining({ method: "HEAD" }),
    );
  });

  it("returns false when the URL responds with an error status", async () => {
    dns.lookup.mockResolvedValue(PUBLIC_ADDR);
    fetch.mockResolvedValue({ ok: false, status: 404 });

    expect(await checkURLActive("https://example.com/missing")).toBe(false);
  });

  it("returns false when the fetch fails", async () => {
    dns.lookup.mockResolvedValue(PUBLIC_ADDR);
    fetch.mockRejectedValue(new Error("ECONNREFUSED"));

    expect(await checkURLActive("https://example.com")).toBe(false);
  });

  it("prepends http:// to scheme-less URLs", async () => {
    dns.lookup.mockResolvedValue(PUBLIC_ADDR);
    fetch.mockResolvedValue({ ok: true, status: 200 });

    expect(await checkURLActive("example.com/data")).toBe(true);
    expect(fetch).toHaveBeenCalledWith("http://example.com/data", expect.any(Object));
  });

  it("returns false when the hostname does not resolve", async () => {
    dns.lookup.mockRejectedValue(new Error("ENOTFOUND"));

    expect(await checkURLActive("http://no-such-host.example")).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  describe("SSRF guard", () => {
    it("rejects non-http(s) schemes", async () => {
      expect(await checkURLActive("ftp://example.com/file")).toBe(false);
      expect(await checkURLActive("file:///etc/passwd")).toBe(false);
      expect(await checkURLActive("gopher://example.com")).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
      expect(dns.lookup).not.toHaveBeenCalled();
    });

    it.each([
      ["loopback", "127.0.0.1"],
      ["10/8", "10.1.2.3"],
      ["172.16/12", "172.16.0.1"],
      ["172.16/12 upper bound", "172.31.255.254"],
      ["192.168/16", "192.168.1.1"],
      ["link-local", "169.254.169.254"],
    ])("rejects hosts resolving to private IPv4 range %s", async (_label, address) => {
      dns.lookup.mockResolvedValue([{ address, family: 4 }]);

      expect(await checkURLActive("http://internal.example.com")).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it.each([
      ["loopback", "::1"],
      ["unique local fc00::/7", "fd12:3456:789a::1"],
      ["link-local fe80::/10", "fe80::1"],
      ["IPv4-mapped private", "::ffff:192.168.0.10"],
    ])("rejects hosts resolving to private IPv6 range %s", async (_label, address) => {
      dns.lookup.mockResolvedValue([{ address, family: 6 }]);

      expect(await checkURLActive("http://internal.example.com")).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("rejects IPv6 literal URLs pointing at loopback", async () => {
      dns.lookup.mockResolvedValue([{ address: "::1", family: 6 }]);

      expect(await checkURLActive("http://[::1]:8080/admin")).toBe(false);
      expect(dns.lookup).toHaveBeenCalledWith("::1", { all: true });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("rejects hostnames where any resolved address is private", async () => {
      dns.lookup.mockResolvedValue([
        { address: "93.184.216.34", family: 4 },
        { address: "10.0.0.5", family: 4 },
      ]);

      expect(await checkURLActive("http://rebind.example.com")).toBe(false);
      expect(fetch).not.toHaveBeenCalled();
    });

    it("allows public addresses", async () => {
      dns.lookup.mockResolvedValue(PUBLIC_ADDR);
      expect(await isSafeUrl("http://example.com")).toBe(true);
    });

    it("allows the boundary neighbours of private IPv4 ranges", async () => {
      dns.lookup.mockResolvedValue([
        { address: "172.15.255.255", family: 4 },
        { address: "172.32.0.1", family: 4 },
        { address: "9.255.255.255", family: 4 },
        { address: "11.0.0.1", family: 4 },
      ]);
      expect(await isSafeUrl("http://example.com")).toBe(true);
    });
  });
});
