import * as Router from 'koa-router'
import * as C from 'src/controller'

import ENV from 'config/env'

const router =
  new Router()
    .get( '/',                               C.View.index)
    .redirect('/auth', '/auth/github')
    .get( '/auth/github',                    C.Auth.oauthFor('github'))

    .get( '/repo/:source/:name',             C.Repo.show)

    .get( '/repo/:source/:name/suite',       C.Repo.Suite.showAll)
    .post('/repo/:source/:name/suite',       C.Repo.Suite.create)

    .get( '/user/repo/github',               C.UserRepo.githubShowAll)
    .get( '/user/repo/github/:name',         C.UserRepo.githubShow)
    .post('/user/repo/:source/:name/auth',   C.UserRepo.createAuth)

if (ENV.oauth.mock) {
  router.get('/auth/mock',                    C.Auth.oauthFor('mock'))
}

export default router
