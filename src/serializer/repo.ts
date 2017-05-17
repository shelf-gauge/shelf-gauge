import { Repo } from 'src/entity'
import Serializer from 'src/util/serializer'

export default new Serializer(Repo, {
  url: Serializer.String,
  source: Serializer.String as Serializer<any>,
  name: Serializer.String,
})