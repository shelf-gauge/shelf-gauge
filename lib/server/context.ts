import { Connection } from 'typeorm'
import { IRouterContext } from 'koa-router'
import HttpStatus from './http-status'
import { Renderer } from './render'

interface Context extends IRouterContext {
  status: HttpStatus
  conn: Connection
  renderJson: Renderer
}

export default Context