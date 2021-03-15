const fs = require('fs');
const path = require('path');
const { extendConfig } = require('hardhat/config');

const { HardhatPluginError } = require('hardhat/plugins');

const {
  TASK_COMPILE,
} = require('hardhat/builtin-tasks/task-names');

extendConfig(function (config, userConfig) {
  config.abiExporter = Object.assign(
    {
      path: './abi',
      clear: false,
      flat: false,
      only: [],
      except: [],
      spacing: 2
    },
    userConfig.abiExporter
  );
});

task(TASK_COMPILE, async function (args, hre, runSuper) {
  const config = hre.config.abiExporter;

  await runSuper();

  const outputDirectory = path.resolve(hre.config.paths.root, config.path);

  if (!outputDirectory.startsWith(hre.config.paths.root)) {
    throw new HardhatPluginError('resolved path must be inside of project directory');
  }

  if (outputDirectory === hre.config.paths.root) {
    throw new HardhatPluginError('resolved path must not be root directory');
  }

  if (config.clear) {
    fs.rmdirSync(outputDirectory, { recursive: true });
  }

  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory, { recursive: true });
  }

  for (let fullName of await hre.artifacts.getAllFullyQualifiedNames()) {
    if (config.only.length && !config.only.some(m => fullName.match(m))) continue;
    if (config.except.length && config.except.some(m => fullName.match(m))) continue;

    const { abi, sourceName, contractName } = await hre.artifacts.readArtifact(fullName);

    console.log(`Exported ${ contractName }`);

    if (!abi.length) continue;

    const destination = path.resolve(
      outputDirectory,
      config.flat ? '' : sourceName,
      contractName
    ) + '.json';

    if (!fs.existsSync(path.dirname(destination))) {
      fs.mkdirSync(path.dirname(destination), { recursive: true });
    }

    fs.writeFileSync(destination, `${ JSON.stringify(abi, null, config.spacing) }\n`, { flag: 'w' });

    const abiJs = path.resolve(
      outputDirectory,
      config.flat ? '' : sourceName,
      contractName
    ) + '.js';

    fs.writeFileSync(abiJs, `export default ${ JSON.stringify(abi, null, config.spacing) };\n`, { flag: 'w' });

    const contractJs = path.resolve(
      outputDirectory,
      config.flat ? '' : sourceName,
      contractName
    ) + '.contract.js';

    let content = `
import {Contract} from 'ethers';
import ContractSettings from '../../contractSettings';
import abi from '../../lib/abis/localhost/${contractName}';

function ${contractName}(contractSettings) {
  this.contractSettings = contractSettings || new ContractSettings();

  this.contract = new Contract(
    this.contractSettings.addressList['${contractName}'],
    abi,
    this.contractSettings.signer || this.contractSettings.provider
  );
    
  `;

    abi.map(item => {
      if (item['type']  == 'function') {
        content += `
  this.${item['name']} = async (`;
        item['inputs'].forEach( (input) => {
          if (input['name']) content += `${input['name']}, `;
        });
        content += `txParams) => {
    txParams = txParams || {};
    return await this.contract.${item['name']}(`;
        item['inputs'].forEach( (input) => {
          if (input['name']) content += `${input['name']}, `;
        });
        content += `txParams);
  };
        `;
      }
    });

    content += `
}
export default ${contractName};`;

    fs.writeFileSync(contractJs, content, { flag: 'w' });

  }
});
