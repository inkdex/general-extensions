
import { TestSuite, registerDefaultTests } from '@paperback/types'
import { MangaKatana } from '../MangaKatana/main'
import sourceInfo from '../MangaKatana/pbconfig'

export async function runTests() {
  const suite = new TestSuite('MangaKatana tests')
  registerDefaultTests(suite, MangaKatana, sourceInfo)
  
  await suite.run()
}
                