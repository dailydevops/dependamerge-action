'use strict'

const getCommand = inputs => {
  const command = inputs['command']

  if (command === 'merge') {
    return 'merge'
  }

  return 'squash'
}

exports.getInputs = inputs => {
  return {
    token: inputs['token'],
    submodule: inputs['submodule'],
    approve: inputs['approve'],
    approveOnly: inputs['approve-only'],
    command: getCommand(inputs),
    target: inputs['target'],
    skipCommitVerification: inputs['skip-commit-verification'],
    skipVerification: inputs['skip-verification']
  }
}

exports.getMetadata = metadata => {
  if (metadata === undefined || metadata === null) {
    return {
      dependecyName: '',
      dependecyType: '',
      updateType: '',
      ecosystem: '',
      targetBranch: '',
      previousVersion: '',
      newVersion: '',
      compatibilityScore: '',
      maintainerChanges: '',
      dependecyGroup: '',
      alertState: '',
      ghsaId: '',
      cvss: ''
    }
  }

  return {
    dependecyName: metadata['dependency-name'],
    dependecyType: metadata['dependency-type'],
    updateType: metadata['update-type'],
    ecosystem: metadata['package-ecosystem'],
    targetBranch: metadata['target-branch'],
    previousVersion: metadata['previous-version'],
    newVersion: metadata['new-version'],
    compatibilityScore: metadata['compatibility-score'],
    maintainerChanges: metadata['maintainer-changes'],
    dependecyGroup: metadata['dependency-group'],
    alertState: metadata['alert-state'],
    ghsaId: metadata['ghsa-id'],
    cvss: metadata['cvss']
  }
}
