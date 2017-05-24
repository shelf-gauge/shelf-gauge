import ENV from 'config/env'

import * as Github from 'github'

import { Repo, RepoCommit } from 'src/entity'

export const API = new Github()

const MAX_PER_PAGE = 100

interface Response<T> {
  data: T,
  meta: any,
}

interface GithubRepo {
  id: number
  name: string
  full_name: string
  description: string
  private: boolean
  fork: boolean
  url: string
  html_url: string

  permissions: {
    admin: boolean
    push: boolean
    pull: boolean
  }
}

interface GithubCommitSummary {
  sha: string,
  url: string,
  html_url: string,
}

interface GithubCommit extends GithubCommitSummary {
  parents: GithubCommitSummary[]
  commit: {
    url: string
    comment_count: number
    author: {
      name: string,
      email: string,
      date: string,
    }
    committer: {
      name: string,
      email: string,
      date: string,
    }
    message: string
    tree: {
      sha: string
      url: string
    }
  }
}

export function toRepo (github: GithubRepo): Repo {
  return new Repo({
    source: 'github',
    name: github.full_name.replace('/', '~'),
    url: github.html_url,
  })
}

export function toCommits (github: GithubCommit[], repo?: Repo): RepoCommit[] {
  const commits = [] as RepoCommit[]
  for (const element of github) {
    for (const parent of element.parents) {
      commits.push(new RepoCommit({
        repo,
        ref: element.sha,
        parent: parent.sha,
      }))
    }
  }
  return commits
}

export function fetchRepos (oauthToken: string): Promise<Response<GithubRepo[]>> {
  API.authenticate({ type: 'oauth', token: oauthToken })
  return API.repos.getAll({
    sort: "updated",
    per_page: MAX_PER_PAGE,
  })
}

export function fetchRepo (oauthToken: string, name: string): Promise<Response<GithubRepo>> {
  const [owner, repo] = name.split('~')
  API.authenticate({ type: 'oauth', token: oauthToken })
  return API.repos.get({ owner, repo })
}

export function fetchCommits (name: string, sha?: string): Promise<Response<GithubCommit[]>> {
  const [owner, repo] = name.split('~')
  API.authenticate({ type: 'oauth', key: ENV.oauth.github.id, secret: ENV.oauth.github.secret })
  return API.repos.getCommits({ owner, repo, sha, per_page: MAX_PER_PAGE })
}
