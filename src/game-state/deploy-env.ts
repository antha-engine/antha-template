export enum DeployEnv {
    Dev = 'dev',
    Prod = 'prod',
}

export function detectDeployEnv(hostname: string) {
    return hostname === 'electrovir.github.io' ? DeployEnv.Prod : DeployEnv.Dev;
}

export const deployEnv: DeployEnv = detectDeployEnv(globalThis.location.hostname);
