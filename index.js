let github = require('@actions/github')
let core = require('@actions/core')

try {
  const token = core.getInput('token')
  const client = new github.GitHub(token)

  const payload = github.context.payload
  const components = payload.ref.split('/')
  const branchName = components[components.length - 1]
  client.pulls.list({
    ...github.context.repo,
    state: 'open',
    base: branchName,
  }).then(openedPrs => {
    Promise.all(
      openedPrs.data.map((pr) => {
        return client.pulls.updateBranch({
          ...github.context.repo,
          pull_number: pr.number,
          expected_head_sha: pr.head.sha,
        }).catch(e => {
          console.log("PR has conflicts: #" + pr.number + " " + pr.title)
        })
      }))
  })
}catch(e){
  core.setFailed(e.message)
}
