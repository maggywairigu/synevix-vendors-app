const convertCloudinaryUrlToPng = (url: string) => {
    if (!url) return url;

    // Remove only the last extension: .avif, .webp, .png, .jpg, etc.
    const cleaned = url.replace(/\.\w+$/, "");

    return `${cleaned}.png`;
  };

export default convertCloudinaryUrlToPng