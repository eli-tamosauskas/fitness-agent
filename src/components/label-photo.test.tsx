import { render, screen } from "@testing-library/react";

import { LabelPhoto } from "@/components/label-photo";
import { LABEL_PHOTO_MARKER_URL } from "@/lib/chat/message";

const DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA==";

describe("LabelPhoto", () => {
  it("shows the photo that was just sent", () => {
    render(
      <LabelPhoto
        id="a"
        part={{ type: "file", mediaType: "image/jpeg", url: DATA_URL }}
      />,
    );

    expect(screen.getByRole("img")).toHaveAttribute("src", DATA_URL);
  });

  it("shows a placeholder where a photo was, once the photo is gone", () => {
    render(
      <LabelPhoto
        id="a"
        part={{
          type: "file",
          mediaType: "image/jpeg",
          url: LABEL_PHOTO_MARKER_URL,
        }}
      />,
    );

    expect(screen.getByRole("img", { name: /photo/i })).toBeInTheDocument();
  });

  it("never points an image at a marker, which would render as broken", () => {
    const { container } = render(
      <LabelPhoto
        id="a"
        part={{
          type: "file",
          mediaType: "image/jpeg",
          filename: "label.jpg",
          url: LABEL_PHOTO_MARKER_URL,
        }}
      />,
    );

    expect(container.querySelector("img")).toBeNull();
  });
});
