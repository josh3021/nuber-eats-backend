enum EnvFile {
  dev = 'dev',
  test = 'test',
  production = 'production',
}

export function matchEnvFile(rawEnvFile: string) {
  switch (EnvFile[rawEnvFile]) {
    case EnvFile.test:
      return '.env.test';
    case EnvFile.production:
      return '.env';
    case EnvFile.dev:
    default:
      return '.env.dev';
  }
}
