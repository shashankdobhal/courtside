import { describe, expect, it } from "vitest";
import { extractYoutubeVideoId, youtubeEmbedUrl } from "./youtube";

describe("extractYoutubeVideoId", () => {
  it("extracts the id from a standard watch URL", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts the id from a watch URL with extra query params", () => {
    expect(
      extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123&t=30s")
    ).toBe("dQw4w9WgXcQ");
  });

  it("extracts the id from a youtu.be short link", () => {
    expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts the id from a youtu.be short link with a query string", () => {
    expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe("dQw4w9WgXcQ");
  });

  it("extracts the id from a /live/ link", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts the id from an /embed/ link", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("extracts the id from a /shorts/ link", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });

  it("handles the m.youtube.com and www-less hosts", () => {
    expect(extractYoutubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
    expect(extractYoutubeVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for an empty or blank string", () => {
    expect(extractYoutubeVideoId("")).toBeNull();
    expect(extractYoutubeVideoId("   ")).toBeNull();
  });

  it("returns null for a non-YouTube URL", () => {
    expect(extractYoutubeVideoId("https://vimeo.com/12345")).toBeNull();
  });

  it("returns null for a malformed URL", () => {
    expect(extractYoutubeVideoId("not a url")).toBeNull();
  });

  it("returns null for a YouTube URL with no video id", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/")).toBeNull();
    expect(extractYoutubeVideoId("https://www.youtube.com/watch")).toBeNull();
  });
});

describe("youtubeEmbedUrl", () => {
  it("builds a standard embed URL", () => {
    expect(youtubeEmbedUrl("dQw4w9WgXcQ")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });
});
