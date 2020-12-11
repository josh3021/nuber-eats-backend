enum EnvFile {
  dev = 'dev',
  test = 'test',
  prod = 'prod',
}

export function matchEnvFile(rawEnvFile: string) {
  switch (EnvFile[rawEnvFile]) {
    case EnvFile.dev:
      return '.env.test';
    case EnvFile.prod:
      return '.env';
    case EnvFile.dev:
    default:
      return '.env.dev';
  }
}
