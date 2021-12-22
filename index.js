let github = require('@actions/github')
let core = require('@actions/core')

async function main() {
  try {
    const token = core.getInput('token')
    const client = new github.getOctokit(token)

    const payload = github.context.payload
    const components = payload.ref.split('/')
    const branchName = components[components.length - 1]
    let mergedPrNumbers = [];
    let conflictedPrNumbers = [];

    const openedPrs = await client.rest.pulls.list({
      ...github.context.repo,
      state: 'open',
      base: branchName,
    })

    await Promise.all(
      openedPrs.data.map(async (pr) => {
        try {
          await client.rest.pulls.updateBranch({
            ...github.context.repo,
            pull_number: pr.number,
            expected_head_sha: pr.head.sha,
          })
          mergedPrNumbers.push(pr.number)
        } catch (e) {
          console.log("PR has conflicts: #" + pr.number + " " + pr.title)
          conflictedPrNumbers.push(pr.number)
        }
      })
    )
    core.setOutput('mergedPrNumbers', mergedPrNumbers.map(x => x.toString()).join('\n'))
    core.setOutput('conflictedPrNumbers', conflictedPrNumbers.map(x => x.toString()).join('\n'))
  } catch (e) {
    core.setFailed(e.message)
  }
}

main();