
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { MangaFire } from '../MangaFire/main'
import sourceInfo from '../MangaFire/pbconfig'

export async function runTests() {
  const suite = new TestSuite('MangaFire tests')
  registerDefaultTests(suite, MangaFire, sourceInfo)
  
  await suite.run()
}
                