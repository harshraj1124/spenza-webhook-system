function isValidUrl(url) {
  try {
    const parsed = new URL(url);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname;

    // Block localhost and private/internal IPs (SSRF protection)
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return false;
    }

    if (
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname)
    ) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

function normalizeSource(source) {
  if (!source || typeof source !== "string") {
    return "";
  }

  return source.trim().toLowerCase();
}

function getShortErrorMessage(error) {
  if (error.response) {
    return `Request failed with status ${error.response.status}`;
  }

  if (error.message) {
    return error.message.substring(0, 200);
  }

  return "Unknown delivery error";
}

module.exports = {
  isValidUrl,
  normalizeSource,
  getShortErrorMessage
};
