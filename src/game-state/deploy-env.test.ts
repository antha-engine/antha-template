import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {DeployEnv, detectDeployEnv} from './deploy-env.js';

describe(detectDeployEnv.name, () => {
    it('detects the production frontend domain', () => {
        assert.strictEquals(detectDeployEnv('antha-engine.github.io'), DeployEnv.Prod);
    });

    it('treats every other frontend domain as development', () => {
        assert.strictEquals(detectDeployEnv('localhost'), DeployEnv.Dev);
    });
});
