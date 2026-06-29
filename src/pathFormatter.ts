export const WINDOWS_COPY_PATH_FORMAT_CONFIG_KEY = "copyExtra.windowsCopyPathFormat";

export type WindowsCopyPathFormat = "default" | "wsl" | "unix" | "cygwin" | "msys" | "gitBash";

export function formatFullPath(
  filePath: string,
  windowsCopyPathFormat: WindowsCopyPathFormat,
  platform: NodeJS.Platform = process.platform
): string {
  if (platform !== "win32") {
    return filePath;
  }

  if (windowsCopyPathFormat === "default") {
    return formatDefaultPath(filePath, platform);
  }

  const drivePath = parseWindowsDrivePath(filePath);
  if (!drivePath) {
    return filePath.replace(/\\/g, "/");
  }

  switch (windowsCopyPathFormat) {
    case "wsl":
      return `/mnt/${drivePath.lowercaseDriveLetter}${drivePath.restPath}`;
    case "unix":
      return `${drivePath.uppercaseDriveLetter}:${drivePath.restPath}`;
    case "cygwin":
      return `/cygdrive/${drivePath.lowercaseDriveLetter}${drivePath.restPath}`;
    case "msys":
    case "gitBash":
      return `/${drivePath.lowercaseDriveLetter}${drivePath.restPath}`;
  }
}

export function formatRelativePath(
  filePath: string,
  windowsCopyPathFormat: WindowsCopyPathFormat,
  platform: NodeJS.Platform = process.platform
): string {
  if (platform !== "win32") {
    return filePath;
  }

  if (windowsCopyPathFormat === "default") {
    return formatDefaultPath(filePath, platform);
  }

  return filePath.replace(/\\/g, "/");
}

function formatDefaultPath(filePath: string, platform: NodeJS.Platform): string {
  if (platform === "win32") {
    return filePath.replace(/\//g, "\\");
  }
  return filePath;
}

function parseWindowsDrivePath(filePath: string): {
  readonly lowercaseDriveLetter: string;
  readonly uppercaseDriveLetter: string;
  readonly restPath: string;
} | undefined {
  if (filePath.length < 2 || filePath.charAt(1) !== ":") {
    return undefined;
  }

  const driveLetter = filePath.charAt(0);
  if (!/^[A-Za-z]$/.test(driveLetter)) {
    return undefined;
  }

  let restPath = filePath.slice(2).replace(/\\/g, "/");
  if (restPath.length === 0) {
    restPath = "/";
  } else if (!restPath.startsWith("/")) {
    restPath = `/${restPath}`;
  }

  return {
    lowercaseDriveLetter: driveLetter.toLowerCase(),
    uppercaseDriveLetter: driveLetter.toUpperCase(),
    restPath
  };
}
