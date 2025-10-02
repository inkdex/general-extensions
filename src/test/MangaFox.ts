
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { MangaFox } from '../MangaFox/main'
import sourceInfo from '../MangaFox/pbconfig'

export async function runTests() {
  const suite = new TestSuite('MangaFox tests')
  registerDefaultTests(suite, MangaFox, sourceInfo)
  
  await suite.run()
}
                